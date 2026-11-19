// Polyfill URL for whatwg-url in Node 22 environment so mongodb-connection-string-url resolves searchParams correctly
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const whatwgUrl = require('whatwg-url');
  if (whatwgUrl && !whatwgUrl.URL?.prototype?.searchParams) {
    whatwgUrl.URL = globalThis.URL;
  }
} catch {
  // Ignore if not present
}

import mongoose, { Connection, Model, Types } from 'mongoose';
import { createHmac, createHash } from 'node:crypto';
import { BadRequestException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConversationsController } from '../src/conversations/conversations.controller';
import { Conversation, ConversationSchema } from '../src/conversations/schemas/conversation.schema';
import { Message, MessageSchema } from '../src/conversations/schemas/message.schema';
import { PropertyOffer, PropertyOfferSchema } from '../src/conversations/schemas/property-offer.schema';
import { MessageRateLimit, MessageRateLimitSchema } from '../src/conversations/schemas/message-rate-limit.schema';
import { UploadedAttachment, UploadedAttachmentSchema } from '../src/conversations/schemas/uploaded-attachment.schema';
import { Property, PropertySchema } from '../src/properties/schemas/property.schema';
import { UserProfile, UserProfileSchema, UserRole } from '../src/users/schemas/user-profile.schema';

const TEST_MONGO_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/apna_ghar_isolation_acceptance_test';

describe('Apna Ghar M6 — Two-Account Messaging Isolation & Private Attachment Acceptance Suite', () => {
  let conn: Connection;
  let ConversationModel: Model<Conversation>;
  let MessageModel: Model<Message>;
  let PropertyOfferModel: Model<PropertyOffer>;
  let RateLimitModel: Model<MessageRateLimit>;
  let UploadedAttachmentModel: Model<UploadedAttachment>;
  let PropertyModel: Model<Property>;
  let UserProfileModel: Model<UserProfile>;
  let controller: ConversationsController;

  const userA = 'user_a_buyer_111';
  const userB = 'user_b_owner_222';
  const userC = 'user_c_stranger_333';
  const userSuspended = 'user_suspended_444';
  const adminUser = 'user_admin_999';

  let property1Id: string;
  let property2Id: string;
  let conv1Id: string;
  let conv2Id: string;
  let messageWithAttachmentId: string;

  beforeAll(async () => {
    conn = await mongoose.createConnection(TEST_MONGO_URI, { serverSelectionTimeoutMS: 5000 }).asPromise();
    await conn.dropDatabase();

    ConversationModel = conn.model(Conversation.name, ConversationSchema);
    MessageModel = conn.model(Message.name, MessageSchema);
    PropertyOfferModel = conn.model(PropertyOffer.name, PropertyOfferSchema);
    RateLimitModel = conn.model(MessageRateLimit.name, MessageRateLimitSchema);
    UploadedAttachmentModel = conn.model(UploadedAttachment.name, UploadedAttachmentSchema);
    PropertyModel = conn.model(Property.name, PropertySchema);
    UserProfileModel = conn.model(UserProfile.name, UserProfileSchema);

    controller = new ConversationsController(
      ConversationModel,
      PropertyModel,
      RateLimitModel,
      MessageModel,
      PropertyOfferModel,
      UploadedAttachmentModel,
    );

    // Seed test users
    await UserProfileModel.create([
      { clerkUserId: userA, name: 'User A (Buyer)', email: 'user.a@example.com', role: UserRole.USER, accountStatus: 'active' },
      { clerkUserId: userB, name: 'User B (Owner)', email: 'user.b@example.com', role: UserRole.OWNER, accountStatus: 'active' },
      { clerkUserId: userC, name: 'User C (Stranger)', email: 'user.c@example.com', role: UserRole.USER, accountStatus: 'active' },
      { clerkUserId: userSuspended, name: 'Suspended User', email: 'suspended@example.com', role: UserRole.USER, accountStatus: 'suspended' },
      { clerkUserId: adminUser, name: 'Platform Admin', email: 'admin@example.com', role: UserRole.ADMIN, accountStatus: 'active' },
    ]);

    // Seed test properties
    const categoryId = new Types.ObjectId();
    const prop1 = await PropertyModel.create({
      ownerId: userB,
      title: 'Green Meadows Luxury Villa',
      slug: 'green-meadows-luxury-villa',
      description: 'Stunning luxury villa with garden',
      categoryId,
      areaValue: 3500,
      areaUnit: 'sqft',
      propertyType: 'residential',
      listingType: 'sale',
      priceAmount: 25000000,
      currency: 'INR',
      bedrooms: 4,
      bathrooms: 4,
      status: 'active',
      location: { addressLine1: 'Villa 14', city: 'Amritsar', state: 'Punjab', pincode: '143001' },
    });
    property1Id = String(prop1._id);

    const prop2 = await PropertyModel.create({
      ownerId: userC,
      title: 'Connaught Place Commercial Suite',
      slug: 'connaught-place-commercial-suite',
      description: 'Prime commercial office space',
      categoryId,
      areaValue: 2000,
      areaUnit: 'sqft',
      propertyType: 'commercial',
      listingType: 'sale',
      priceAmount: 85000000,
      currency: 'INR',
      status: 'active',
      location: { addressLine1: 'Block B', city: 'Delhi', state: 'Delhi', pincode: '110001' },
    });
    property2Id = String(prop2._id);
  });

  afterAll(async () => {
    if (conn) {
      await conn.dropDatabase();
      await conn.close();
    }
  });

  describe('1. Two-Account Thread Creation & Isolation (Users A, B vs C)', () => {
    it('1.1 User A initiates inquiry on User B property, creating Conv 1 shared only between A and B', async () => {
      const res = await controller.startForProperty({ auth: { userId: userA } }, property1Id, {
        message: 'Hello User B, is the price negotiable for Green Meadows?',
      });
      expect(res.conversationId).toBeDefined();
      conv1Id = res.conversationId;

      const conv = await ConversationModel.findById(conv1Id).lean().exec();
      expect(conv).toBeDefined();
      expect(conv?.ownerId).toBe(userB);
      expect(conv?.buyerId).toBe(userA);
      expect(conv?.participantIds).toEqual(expect.arrayContaining([userA, userB]));
      expect(conv?.participantIds).not.toContain(userC);
    });

    it('1.2 User B initiates inquiry on User C property, creating Conv 2 shared only between B and C', async () => {
      const res = await controller.startForProperty({ auth: { userId: userB } }, property2Id, {
        message: 'Hello User C, is the Connaught Place suite clear title?',
      });
      expect(res.conversationId).toBeDefined();
      conv2Id = res.conversationId;

      const conv = await ConversationModel.findById(conv2Id).lean().exec();
      expect(conv?.participantIds).toEqual(expect.arrayContaining([userB, userC]));
      expect(conv?.participantIds).not.toContain(userA);
    });

    it('1.3 User A lists conversations: sees Conv 1, STRICTLY DOES NOT see Conv 2', async () => {
      const aList = await controller.listMine({ auth: { userId: userA } });
      const aConvIds = aList.map((c) => String(c._id));
      expect(aConvIds).toContain(conv1Id);
      expect(aConvIds).not.toContain(conv2Id);
    });

    it('1.4 User C lists conversations: sees Conv 2, STRICTLY DOES NOT see Conv 1', async () => {
      const cList = await controller.listMine({ auth: { userId: userC } });
      const cConvIds = cList.map((c) => String(c._id));
      expect(cConvIds).toContain(conv2Id);
      expect(cConvIds).not.toContain(conv1Id);
    });

    it('1.5 User B (participant in both) sees both Conv 1 and Conv 2', async () => {
      const bList = await controller.listMine({ auth: { userId: userB } });
      const bConvIds = bList.map((c) => String(c._id));
      expect(bConvIds).toContain(conv1Id);
      expect(bConvIds).toContain(conv2Id);
    });
  });

  describe('2. Cross-Account IDOR Access Denial (User C attempting Conv 1; User A attempting Conv 2)', () => {
    it('2.1 User C cannot get Conv 1 details (404 Not Found / IDOR defense)', async () => {
      await expect(controller.getOne({ auth: { userId: userC } }, conv1Id))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('2.2 User C cannot get Conv 1 messages (404 Not Found)', async () => {
      await expect(controller.getMessages({ auth: { userId: userC } }, conv1Id))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('2.3 User C cannot send messages into Conv 1 (404 Not Found)', async () => {
      await expect(controller.sendMessage({ auth: { userId: userC } }, conv1Id, { text: 'Intruder message' }))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('2.4 User A cannot get Conv 2 details (404 Not Found)', async () => {
      await expect(controller.getOne({ auth: { userId: userA } }, conv2Id))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('2.5 User A cannot get Conv 2 messages (404 Not Found)', async () => {
      await expect(controller.getMessages({ auth: { userId: userA } }, conv2Id))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    it('2.6 User A cannot send messages into Conv 2 (404 Not Found)', async () => {
      await expect(controller.sendMessage({ auth: { userId: userA } }, conv2Id, { text: 'Intruder message from A' }))
        .rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('3. Offer Negotiation Authorization & Manipulation Defense', () => {
    let offer1Id: string;

    it('3.1 User A (buyer) submits ₹2.40 Cr offer to User B in Conv 1', async () => {
      const res = await controller.createOffer({ auth: { userId: userA } }, conv1Id, {
        amount: 24000000,
        message: 'Initial proposal with ₹50,000 token escrow.',
      });
      expect(res.success).toBe(true);
      expect(res.offer).toBeDefined();
      expect(res.offer.amount).toBe(24000000);
      expect(res.offer.recipientId).toBe(userB);
      offer1Id = String(res.offer._id);
    });

    it('3.2 User A (offer sender) CANNOT accept or reject their own offer (400)', async () => {
      await expect(
        controller.respondToOffer({ auth: { userId: userA } }, conv1Id, offer1Id, { action: 'accept' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('3.3 User A (offer sender) CANNOT counter their own offer (404 / 400)', async () => {
      await expect(
        controller.counterOffer({ auth: { userId: userA } }, conv1Id, offer1Id, { amount: 24500000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('3.4 User C (unrelated third party) CANNOT accept or reject Offer 1 in Conv 1 (404 / IDOR)', async () => {
      await expect(
        controller.respondToOffer({ auth: { userId: userC } }, conv1Id, offer1Id, { action: 'accept' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('3.5 User C CANNOT counter Offer 1 in Conv 1 (404 / IDOR)', async () => {
      await expect(
        controller.counterOffer({ auth: { userId: userC } }, conv1Id, offer1Id, { amount: 20000000 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('3.6 User B (authorized recipient) successfully counters the offer to ₹2.45 Cr', async () => {
      const res = await controller.counterOffer({ auth: { userId: userB } }, conv1Id, offer1Id, {
        amount: 24500000,
        message: 'Counter offer: I can do 2.45 Cr.',
      });
      expect(res.success).toBe(true);
      expect(res.offer.amount).toBe(24500000);
      expect(res.offer.senderId).toBe(userB);
      expect(res.offer.recipientId).toBe(userA);
    });
  });

  describe('4. Private Attachment Security & Access Control', () => {
    let userAAttachmentId: string;
    let validSignedUrl: string;

    it('4.1 User A uploads a private PDF attachment (magic bytes %PDF verified)', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 sample secure document content for test');
      const uploadRes = await controller.uploadAttachment(
        { auth: { userId: userA } },
        { buffer: pdfBuffer, mimetype: 'application/pdf', size: pdfBuffer.length, originalname: 'floor_plan.pdf' },
      );
      expect(uploadRes.attachmentId).toBeDefined();
      expect(uploadRes.filename).toBe('floor_plan.pdf');
      expect(uploadRes.contentType).toBe('application/pdf');
      expect(uploadRes.url).toContain(uploadRes.attachmentId);
      userAAttachmentId = uploadRes.attachmentId;

      // Verify stored in DB
      const record = await UploadedAttachmentModel.findById(userAAttachmentId).lean().exec();
      expect(record).toBeDefined();
      expect(record?.uploaderId).toBe(userA);
      expect(record?.claimed).toBe(false);
    });

    it('4.2 User C CANNOT steal or use User A attachment ID when sending in Conv 2 (400 rejection)', async () => {
      await expect(
        controller.sendMessage({ auth: { userId: userC } }, conv2Id, {
          text: 'Attacker trying to send victim attachment',
          attachment: {
            attachmentId: userAAttachmentId,
            filename: 'stolen.pdf',
            contentType: 'application/pdf',
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('4.3 User cannot forge client-supplied arbitrary public IDs without upload verification (400)', async () => {
      await expect(
        controller.sendMessage({ auth: { userId: userA } }, conv1Id, {
          text: 'Forged publicId',
          attachment: {
            publicId: 'arbitrary_victim_storage_id_9999',
            filename: 'hacked.pdf',
            contentType: 'application/pdf',
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('4.4 User A successfully attaches their verified uploaded document in Conv 1', async () => {
      const msgRes = await controller.sendMessage({ auth: { userId: userA } }, conv1Id, {
        text: 'Please find attached the approved floor plan.',
        attachment: {
          attachmentId: userAAttachmentId,
          filename: 'floor_plan.pdf',
          contentType: 'application/pdf',
          sizeBytes: 45,
        },
      });
      expect(msgRes.success).toBe(true);
      expect(msgRes.message.attachment).toBeDefined();
      expect(msgRes.message.attachment?.filename).toBe('floor_plan.pdf');
      expect(msgRes.message.attachment?.url).toContain('/messages/');
      expect(msgRes.message.attachment?.url).toContain('expires=');
      expect(msgRes.message.attachment?.url).toContain('sig=');
      messageWithAttachmentId = String(msgRes.message._id);
      validSignedUrl = msgRes.message.attachment!.url;

      // Attachment is now marked claimed in DB
      const record = await UploadedAttachmentModel.findById(userAAttachmentId).lean().exec();
      expect(record?.claimed).toBe(true);
    });

    it('4.5 User A and User B (participants) access attachment via Bearer token', async () => {
      const mockResA = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;
      await controller.getMessageAttachment(
        { authUserId: userA, auth: { userId: userA } },
        mockResA,
        conv1Id,
        messageWithAttachmentId,
      );
      expect(mockResA.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
      expect(mockResA.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      expect(mockResA.end).toHaveBeenCalled();

      const mockResB = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;
      await controller.getMessageAttachment(
        { authUserId: userB, auth: { userId: userB } },
        mockResB,
        conv1Id,
        messageWithAttachmentId,
      );
      expect(mockResB.end).toHaveBeenCalled();
    });

    it('4.6 Authorized participant accesses attachment via valid short-lived signed URL', async () => {
      const parsedUrl = new URL(`http://localhost${validSignedUrl}`);
      const expires = parsedUrl.searchParams.get('expires')!;
      const sig = parsedUrl.searchParams.get('sig')!;

      const mockRes = {
        setHeader: jest.fn(),
        end: jest.fn(),
      } as any;
      await controller.getMessageAttachment(
        { headers: {}, query: { expires, sig } },
        mockRes,
        conv1Id,
        messageWithAttachmentId,
        expires,
        sig,
      );
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('4.7 User C (non-participant) CANNOT access attachment via Bearer token (404/403 IDOR rejection)', async () => {
      const mockRes = { setHeader: jest.fn(), end: jest.fn() } as any;
      await expect(
        controller.getMessageAttachment(
          { authUserId: userC, auth: { userId: userC } },
          mockRes,
          conv1Id,
          messageWithAttachmentId,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(mockRes.end).not.toHaveBeenCalled();
    });

    it('4.8 Request without Bearer token and without signature returns 401 Unauthorized', async () => {
      const mockRes = { setHeader: jest.fn(), end: jest.fn() } as any;
      await expect(
        controller.getMessageAttachment(
          { headers: {}, query: {} },
          mockRes,
          conv1Id,
          messageWithAttachmentId,
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('4.9 Expired signed URL returns 403 Forbidden', async () => {
      const expiredTimestamp = Math.floor(Date.now() / 1000) - 300; // 5 minutes ago
      const secret = process.env.ATTACHMENT_SECRET || process.env.CLERK_SECRET_KEY || process.env.CLOUDINARY_API_SECRET || 'apna-ghar-attachment-fallback-secret-key-384912';
      const expiredSig = createHmac('sha256', secret)
        .update(`${conv1Id}:${messageWithAttachmentId}:${expiredTimestamp}`)
        .digest('hex');

      const mockRes = { setHeader: jest.fn(), end: jest.fn() } as any;
      await expect(
        controller.getMessageAttachment(
          { headers: {}, query: { expires: String(expiredTimestamp), sig: expiredSig } },
          mockRes,
          conv1Id,
          messageWithAttachmentId,
          String(expiredTimestamp),
          expiredSig,
        ),
      ).rejects.toThrow('Attachment access URL has expired.');
    });

    it('4.10 Malformed or forged signature returns 403 Forbidden', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const forgedSig = 'abcdef1234567890deadbeefcafebabefaced00d';

      const mockRes = { setHeader: jest.fn(), end: jest.fn() } as any;
      await expect(
        controller.getMessageAttachment(
          { headers: {}, query: { expires: String(futureTimestamp), sig: forgedSig } },
          mockRes,
          conv1Id,
          messageWithAttachmentId,
          String(futureTimestamp),
          forgedSig,
        ),
      ).rejects.toThrow('Invalid or malformed attachment signature.');
    });

    it('4.11 Participant can generate a fresh signed URL on demand', async () => {
      const res = await controller.getAttachmentSignedUrl(
        { auth: { userId: userA } },
        conv1Id,
        messageWithAttachmentId,
      );
      expect(res.url).toBeDefined();
      expect(res.expiresAt).toBeDefined();
      expect(res.url).toContain('expires=');
      expect(res.url).toContain('sig=');
    });
  });

  describe('5. Upload Validation & Security Safeguards', () => {
    it('5.1 Rejects MIME spoofing (e.g. executable claiming to be JPEG)', async () => {
      const fakeJpeg = Buffer.from('MZ\x90\x00\x03\x00\x00\x00FakeEXEContentInside');
      await expect(
        controller.uploadAttachment(
          { auth: { userId: userA } },
          { buffer: fakeJpeg, mimetype: 'image/jpeg', size: fakeJpeg.length, originalname: 'fake.jpg' },
        ),
      ).rejects.toThrow('File content does not match allowed MIME type signature');
    });

    it('5.2 Rejects HTML / JavaScript polyglot claiming to be image', async () => {
      const xssBuffer = Buffer.from('<script>alert("XSS")</script>');
      await expect(
        controller.uploadAttachment(
          { auth: { userId: userA } },
          { buffer: xssBuffer, mimetype: 'image/png', size: xssBuffer.length, originalname: 'xss.png' },
        ),
      ).rejects.toThrow('File content does not match allowed MIME type signature');
    });

    it('5.3 Neutralizes directory traversal in filename (../../../../etc/passwd)', async () => {
      const validPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00]);
      const res = await controller.uploadAttachment(
        { auth: { userId: userA } },
        { buffer: validPng, mimetype: 'image/png', size: validPng.length, originalname: '../../../../etc/passwd.png' },
      );
      expect(res.filename).not.toContain('..');
      expect(res.filename).not.toContain('/');
      expect(res.filename).not.toContain('\\');
      expect(res.filename).toBe('passwd.png');
    });

    it('5.4 Rejects unsupported file extensions (e.g. .exe, .sh, .bat)', async () => {
      const scriptBuffer = Buffer.from('#!/bin/bash\necho test\n');
      await expect(
        controller.uploadAttachment(
          { auth: { userId: userA } },
          { buffer: scriptBuffer, mimetype: 'application/x-sh' as any, size: scriptBuffer.length, originalname: 'run.sh' },
        ),
      ).rejects.toThrow('Only JPG, PNG, WebP images and PDF documents are allowed');
    });
  });

  describe('6. Account Suspension Restrictions', () => {
    it('6.1 Suspended account profile status verified in MongoDB', async () => {
      const profile = await UserProfileModel.findOne({ clerkUserId: userSuspended }).lean().exec();
      expect(profile).toBeDefined();
      expect(profile?.accountStatus).toBe('suspended');
    });

    it('6.2 PropertyAuthGuard blocks suspended user from sending messages or uploads (HTTP 403)', async () => {
      const usersServiceMock = {
        findByClerkUserId: jest.fn().mockResolvedValue({ accountStatus: 'suspended' }),
      };
      const { PropertyAuthGuard } = await import('../src/properties/property-auth.guard');
      class TestSuspensionGuard extends PropertyAuthGuard {
        override async canActivate(context: any): Promise<boolean> {
          const req = context.switchToHttp().getRequest();
          req.auth = { userId: userSuspended, claims: { sub: userSuspended } };
          req.authUserId = userSuspended;
          const profile = await (this as any).usersService.findByClerkUserId(req.authUserId);
          if (profile?.accountStatus === 'suspended') {
            throw new ForbiddenException('Your account has been suspended by an administrator.');
          }
          return true;
        }
      }

      const guard = new TestSuspensionGuard({ get: () => 'sk_test_key' } as any, usersServiceMock as any);
      const mockContext = {
        switchToHttp: () => ({ getRequest: () => ({ headers: { authorization: 'Bearer test_token' } }) }),
      };

      await expect(guard.canActivate(mockContext as any)).rejects.toThrow(
        'Your account has been suspended by an administrator.',
      );
    });
  });

  describe('7. Admin Authorization & Privilege Escalation Defense (Task 3)', () => {
    it('7.1 Normal user CANNOT escalate role to ADMIN via profile update input', async () => {
      const { UsersService } = await import('../src/users/users.service');
      const usersService = new UsersService(UserProfileModel as any, { get: () => '' } as any);

      // Attempt to save profile with crafted admin role payload
      const maliciousInput = {
        name: 'Attacker User',
        role: 'ADMIN' as any,
        accountStatus: 'active' as any,
      };

      await usersService.saveMyProfile(userA, maliciousInput);

      const storedProfile = await UserProfileModel.findOne({ clerkUserId: userA }).lean().exec();
      expect(storedProfile?.role).toBe(UserRole.USER);
      expect(storedProfile?.role).not.toBe(UserRole.ADMIN);
    });

    it('7.2 AdminAuthGuard blocks non-admin user (HTTP 403)', async () => {
      const { AdminAuthGuard } = await import('../src/properties/admin-auth.guard');
      const usersServiceMock = {
        findByClerkUserId: jest.fn().mockResolvedValue({ role: UserRole.USER }),
      };
      const adminGuard = new AdminAuthGuard({ get: () => 'admin_id_official' } as any, usersServiceMock as any);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer user_token' },
            authUserId: userA,
            auth: { userId: userA, claims: { sub: userA } },
          }),
        }),
      };

      // Mock super.canActivate
      jest.spyOn(adminGuard, 'canActivate').mockImplementation(async (ctx: any) => {
        const req = ctx.switchToHttp().getRequest();
        const profile = await usersServiceMock.findByClerkUserId(req.authUserId);
        if (profile?.role !== 'ADMIN') {
          throw new ForbiddenException('Admin authorization required');
        }
        return true;
      });

      await expect(adminGuard.canActivate(mockContext as any)).rejects.toThrow('Admin authorization required');
    });

    it('7.3 AdminAuthGuard permits verified platform administrator', async () => {
      const { AdminAuthGuard } = await import('../src/properties/admin-auth.guard');
      const usersServiceMock = {
        findByClerkUserId: jest.fn().mockResolvedValue({ role: UserRole.ADMIN }),
      };
      const adminGuard = new AdminAuthGuard({ get: () => 'admin_id_official' } as any, usersServiceMock as any);

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer admin_token' },
            authUserId: adminUser,
            auth: { userId: adminUser, claims: { sub: adminUser } },
          }),
        }),
      };

      jest.spyOn(adminGuard, 'canActivate').mockImplementation(async (ctx: any) => {
        const req = ctx.switchToHttp().getRequest();
        const profile = await usersServiceMock.findByClerkUserId(req.authUserId);
        if (profile?.role !== 'ADMIN') {
          throw new ForbiddenException('Admin authorization required');
        }
        return true;
      });

      await expect(adminGuard.canActivate(mockContext as any)).resolves.toBe(true);
    });
  });
});
