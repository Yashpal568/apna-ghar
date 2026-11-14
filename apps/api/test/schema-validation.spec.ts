import mongoose from 'mongoose';
import { UserProfile, UserProfileSchema, UserRole } from '../src/users/schemas/user-profile.schema';
import { Property, PropertySchema } from '../src/properties/schemas/property.schema';
import { SavedProperty, SavedPropertySchema } from '../src/properties/schemas/saved-property.schema';
import { VisitRequest, VisitRequestSchema } from '../src/properties/schemas/visit-request.schema';
import { PropertyReport, PropertyReportSchema } from '../src/properties/schemas/property-report.schema';
import { Conversation, ConversationSchema } from '../src/conversations/schemas/conversation.schema';
import { Message, MessageSchema } from '../src/conversations/schemas/message.schema';
import { PropertyOffer, PropertyOfferSchema } from '../src/conversations/schemas/property-offer.schema';
import { MessageRateLimit, MessageRateLimitSchema } from '../src/conversations/schemas/message-rate-limit.schema';
import { PropertyCategory, PropertyCategorySchema } from '../src/categories/schemas/property-category.schema';
import { AuditLog, AuditLogSchema } from '../src/admin/schemas/audit-log.schema';

describe('Apna Ghar MongoDB Schemas Acceptance Specification', () => {
  describe('1. UserProfile Schema (user_profiles)', () => {
    const UserProfileModel = mongoose.model<UserProfile>('UserProfileTest', UserProfileSchema);

    it('requires clerkUserId', async () => {
      const doc = new UserProfileModel({});
      const err = doc.validateSync();
      expect(err?.errors['clerkUserId']).toBeDefined();
    });

    it('defaults role to USER and accountStatus to active', async () => {
      const doc = new UserProfileModel({ clerkUserId: 'user_123' });
      expect(doc.role).toBe(UserRole.USER);
      expect(doc.accountStatus).toBe('active');
      expect(doc.lastActiveAt).toBeInstanceOf(Date);
    });

    it('rejects invalid role and accountStatus enums', async () => {
      const doc = new UserProfileModel({
        clerkUserId: 'user_123',
        role: 'SUPERADMIN' as never,
        accountStatus: 'banned' as never,
      });
      const err = doc.validateSync();
      expect(err?.errors['role']).toBeDefined();
      expect(err?.errors['accountStatus']).toBeDefined();
    });

    it('accepts valid roles: USER, OWNER, ADMIN', async () => {
      for (const role of [UserRole.USER, UserRole.OWNER, UserRole.ADMIN]) {
        const doc = new UserProfileModel({ clerkUserId: `user_${role}`, role });
        expect(doc.validateSync()).toBeUndefined();
      }
    });

    it('enforces string trimming and length constraints', async () => {
      const doc = new UserProfileModel({
        clerkUserId: '  user_padded  ',
        email: '  TEST@EXAMPLE.COM  ',
      });
      expect(doc.clerkUserId).toBe('user_padded');
      expect(doc.email).toBe('test@example.com');
    });

    it('verifies index definitions on UserProfileSchema', () => {
      const indexes = UserProfileSchema.indexes();
      const hasClerkIndex = indexes.some(([idx]) => (idx as Record<string, unknown>).clerkUserId !== undefined);
      const hasRoleStatusIndex = indexes.some(([idx]) => (idx as Record<string, unknown>).role === 1 && (idx as Record<string, unknown>).accountStatus === 1);
      const hasEmailIndex = indexes.some(([idx]) => (idx as Record<string, unknown>).email === 1);
      expect(hasClerkIndex).toBe(true);
      expect(hasRoleStatusIndex).toBe(true);
      expect(hasEmailIndex).toBe(true);
    });
  });

  describe('2. Property Schema (properties)', () => {
    const PropertyModel = mongoose.model<Property>('PropertyTest', PropertySchema);

    it('fails validation when required fields are missing', async () => {
      const doc = new PropertyModel({});
      const err = doc.validateSync();
      expect(err?.errors['ownerId']).toBeDefined();
      expect(err?.errors['title']).toBeDefined();
      expect(err?.errors['slug']).toBeDefined();
      expect(err?.errors['description']).toBeDefined();
      expect(err?.errors['categoryId']).toBeDefined();
      expect(err?.errors['listingType']).toBeDefined();
      expect(err?.errors['priceAmount']).toBeDefined();
      expect(err?.errors['areaValue']).toBeDefined();
      expect(err?.errors['areaUnit']).toBeDefined();
      expect(err?.errors['location']).toBeDefined();
    });

    it('validates location sub-schema state and city', async () => {
      const doc = new PropertyModel({
        ownerId: 'owner_1',
        title: 'Nice house',
        slug: 'nice-house',
        description: 'desc',
        categoryId: 'flat',
        listingType: 'sale',
        priceAmount: 1000000,
        areaValue: 1200,
        areaUnit: 'sqft',
        location: { state: '', city: '' },
      });
      const err = doc.validateSync();
      expect(err?.errors['location.state']).toBeDefined();
      expect(err?.errors['location.city']).toBeDefined();
    });

    it('rejects invalid listingType or areaUnit enums', async () => {
      const doc = new PropertyModel({
        ownerId: 'owner_1',
        title: 'Nice house',
        slug: 'nice-house',
        description: 'desc',
        categoryId: 'flat',
        listingType: 'lease' as never,
        priceAmount: 1000000,
        areaValue: 1200,
        areaUnit: 'yards' as never,
        location: { state: 'Punjab', city: 'Amritsar' },
      });
      const err = doc.validateSync();
      expect(err?.errors['listingType']).toBeDefined();
      expect(err?.errors['areaUnit']).toBeDefined();
    });

    it('rejects negative priceAmount and negative areaValue', async () => {
      const doc = new PropertyModel({
        ownerId: 'owner_1',
        title: 'Nice house',
        slug: 'nice-house',
        description: 'desc',
        categoryId: 'flat',
        listingType: 'sale',
        priceAmount: -500,
        areaValue: 0,
        areaUnit: 'sqft',
        location: { state: 'Punjab', city: 'Amritsar' },
      });
      const err = doc.validateSync();
      expect(err?.errors['priceAmount']).toBeDefined();
      expect(err?.errors['areaValue']).toBeDefined();
    });

    it('defaults status to active and viewsCount to 0', async () => {
      const doc = new PropertyModel({
        ownerId: 'owner_1',
        title: 'Nice house',
        slug: 'nice-house',
        description: 'desc',
        categoryId: 'flat',
        listingType: 'sale',
        priceAmount: 5000000,
        areaValue: 1200,
        areaUnit: 'sqft',
        location: { state: 'Punjab', city: 'Amritsar' },
      });
      expect(doc.status).toBe('active');
      expect(doc.viewsCount).toBe(0);
      expect(doc.currency).toBe('INR');
      expect(doc.publishedAt).toBeInstanceOf(Date);
      expect(doc.deletedAt).toBeNull();
      expect(doc.validateSync()).toBeUndefined();
    });

    it('verifies compound search and lookup indexes', () => {
      const indexes = PropertySchema.indexes();
      const hasCityIndex = indexes.some(([idx]) => (idx as Record<string, unknown>)['location.city'] === 1);
      const hasCategoryIndex = indexes.some(([idx]) => (idx as Record<string, unknown>).categoryId === 1);
      const hasOwnerIndex = indexes.some(([idx]) => (idx as Record<string, unknown>).ownerId === 1);
      const hasStatusIndex = indexes.some(([idx]) => (idx as Record<string, unknown>).status === 1);
      expect(hasCityIndex).toBe(true);
      expect(hasCategoryIndex).toBe(true);
      expect(hasOwnerIndex).toBe(true);
      expect(hasStatusIndex).toBe(true);
    });
  });

  describe('3. SavedProperty Schema (saved_properties)', () => {
    const SavedPropertyModel = mongoose.model<SavedProperty>('SavedPropertyTest', SavedPropertySchema);

    it('requires userId and propertyId', async () => {
      const doc = new SavedPropertyModel({});
      const err = doc.validateSync();
      expect(err?.errors['userId']).toBeDefined();
      expect(err?.errors['propertyId']).toBeDefined();
    });

    it('validates a correct saved property document', async () => {
      const doc = new SavedPropertyModel({ userId: 'user_1', propertyId: '507f1f77bcf86cd799439011' });
      expect(doc.validateSync()).toBeUndefined();
    });

    it('verifies compound unique index on userId and propertyId', () => {
      const indexes = SavedPropertySchema.indexes();
      const uniquePair = indexes.find(
        ([idx, opts]) => (idx as Record<string, unknown>).userId === 1 && (idx as Record<string, unknown>).propertyId === 1 && (opts as { unique?: boolean })?.unique === true,
      );
      expect(uniquePair).toBeDefined();
    });
  });

  describe('4. VisitRequest Schema (visit_requests)', () => {
    const VisitRequestModel = mongoose.model<VisitRequest>('VisitRequestTest', VisitRequestSchema);

    it('requires userId, propertyId, preferredDate, and preferredTime', async () => {
      const doc = new VisitRequestModel({});
      const err = doc.validateSync();
      expect(err?.errors['userId']).toBeDefined();
      expect(err?.errors['propertyId']).toBeDefined();
      expect(err?.errors['preferredDate']).toBeDefined();
      expect(err?.errors['preferredTime']).toBeDefined();
    });

    it('defaults status to requested and accepts valid statuses', async () => {
      const doc = new VisitRequestModel({
        userId: 'user_1',
        propertyId: 'prop_1',
        preferredDate: '2026-12-01',
        preferredTime: '14:30',
      });
      expect(doc.status).toBe('requested');
      expect(doc.validateSync()).toBeUndefined();

      for (const status of ['requested', 'confirmed', 'declined', 'cancelled']) {
        doc.status = status;
        expect(doc.validateSync()).toBeUndefined();
      }
    });

    it('rejects invalid status enum', async () => {
      const doc = new VisitRequestModel({
        userId: 'user_1',
        propertyId: 'prop_1',
        preferredDate: '2026-12-01',
        preferredTime: '14:30',
        status: 'postponed' as never,
      });
      const err = doc.validateSync();
      expect(err?.errors['status']).toBeDefined();
    });
  });

  describe('5. PropertyReport Schema (property_reports)', () => {
    const PropertyReportModel = mongoose.model<PropertyReport>('PropertyReportTest', PropertyReportSchema);

    it('requires reporterId, propertyId, and reason', async () => {
      const doc = new PropertyReportModel({});
      const err = doc.validateSync();
      expect(err?.errors['reporterId']).toBeDefined();
      expect(err?.errors['propertyId']).toBeDefined();
      expect(err?.errors['reason']).toBeDefined();
    });

    it('defaults status to open and validates reason enum', async () => {
      const validReasons = ['misleading', 'duplicate', 'scam', 'wrong_information', 'inappropriate', 'other'];
      for (const reason of validReasons) {
        const doc = new PropertyReportModel({
          reporterId: 'user_1',
          propertyId: 'prop_1',
          reason,
        });
        expect(doc.status).toBe('open');
        expect(doc.validateSync()).toBeUndefined();
      }
    });

    it('rejects invalid reason enum', async () => {
      const doc = new PropertyReportModel({
        reporterId: 'user_1',
        propertyId: 'prop_1',
        reason: 'fake_reason' as never,
      });
      const err = doc.validateSync();
      expect(err?.errors['reason']).toBeDefined();
    });
  });

  describe('6. Conversation Schema (conversations)', () => {
    const ConversationModel = mongoose.model<Conversation>('ConversationTest', ConversationSchema);

    it('requires propertyId, propertyTitle, propertySlug, ownerId, and buyerId', async () => {
      const doc = new ConversationModel({});
      const err = doc.validateSync();
      expect(err?.errors['propertyId']).toBeDefined();
      expect(err?.errors['propertyTitle']).toBeDefined();
      expect(err?.errors['propertySlug']).toBeDefined();
      expect(err?.errors['ownerId']).toBeDefined();
      expect(err?.errors['buyerId']).toBeDefined();
    });

    it('validates a complete conversation document and default timestamps', async () => {
      const doc = new ConversationModel({
        propertyId: '507f1f77bcf86cd799439011',
        propertyTitle: 'Sunset Villa',
        propertySlug: 'sunset-villa',
        ownerId: 'owner_1',
        buyerId: 'buyer_1',
        participantIds: ['owner_1', 'buyer_1'],
      });
      expect(doc.validateSync()).toBeUndefined();
      expect(doc.lastMessageAt).toBeInstanceOf(Date);
      expect(doc.messages).toEqual([]);
    });

    it('verifies unique compound index on propertyId and buyerId', () => {
      const indexes = ConversationSchema.indexes();
      const uniquePair = indexes.find(
        ([idx, opts]) => (idx as Record<string, unknown>).propertyId === 1 && (idx as Record<string, unknown>).buyerId === 1 && (opts as { unique?: boolean })?.unique === true,
      );
      expect(uniquePair).toBeDefined();
    });
  });

  describe('7. Message Schema (messages)', () => {
    const MessageModel = mongoose.model<Message>('MessageTest', MessageSchema);

    it('requires conversationId, senderId, and sentAt', async () => {
      const doc = new MessageModel({});
      const err = doc.validateSync();
      expect(err?.errors['conversationId']).toBeDefined();
      expect(err?.errors['senderId']).toBeDefined();
      expect(err?.errors['sentAt']).toBeDefined();
    });

    it('validates message document with text and optional attachment', async () => {
      const doc = new MessageModel({
        conversationId: new mongoose.Types.ObjectId(),
        senderId: 'user_1',
        text: 'Hello world',
        sentAt: new Date(),
        attachment: {
          url: 'https://cloudinary.com/test.png',
          filename: 'test.png',
          contentType: 'image/png',
          sizeBytes: 1024,
        },
      });
      expect(doc.validateSync()).toBeUndefined();
    });
  });

  describe('8. PropertyOffer Schema (property_offers)', () => {
    const PropertyOfferModel = mongoose.model<PropertyOffer>('PropertyOfferTest', PropertyOfferSchema);

    it('requires conversationId, propertyId, buyerId, ownerId, senderId, recipientId, amount, askingPriceAtOffer', async () => {
      const doc = new PropertyOfferModel({});
      const err = doc.validateSync();
      expect(err?.errors['conversationId']).toBeDefined();
      expect(err?.errors['propertyId']).toBeDefined();
      expect(err?.errors['buyerId']).toBeDefined();
      expect(err?.errors['ownerId']).toBeDefined();
      expect(err?.errors['senderId']).toBeDefined();
      expect(err?.errors['recipientId']).toBeDefined();
      expect(err?.errors['amount']).toBeDefined();
      expect(err?.errors['askingPriceAtOffer']).toBeDefined();
    });

    it('defaults status to pending and validates amount boundaries', async () => {
      const doc = new PropertyOfferModel({
        conversationId: new mongoose.Types.ObjectId(),
        propertyId: 'prop_1',
        buyerId: 'buyer_1',
        ownerId: 'owner_1',
        senderId: 'buyer_1',
        recipientId: 'owner_1',
        amount: 2500000,
        askingPriceAtOffer: 3000000,
      });
      expect(doc.status).toBe('pending');
      expect(doc.previousOfferId).toBeNull();
      expect(doc.validateSync()).toBeUndefined();
    });

    it('rejects amount <= 0', async () => {
      const doc = new PropertyOfferModel({
        conversationId: new mongoose.Types.ObjectId(),
        propertyId: 'prop_1',
        buyerId: 'buyer_1',
        ownerId: 'owner_1',
        senderId: 'buyer_1',
        recipientId: 'owner_1',
        amount: 0,
        askingPriceAtOffer: 3000000,
      });
      const err = doc.validateSync();
      expect(err?.errors['amount']).toBeDefined();
    });
  });

  describe('9. MessageRateLimit Schema (message_rate_limits)', () => {
    const RateLimitModel = mongoose.model<MessageRateLimit>('RateLimitTest', MessageRateLimitSchema);

    it('requires _id, windowStartedAt, count, and expiresAt', async () => {
      const doc = new RateLimitModel({});
      const err = doc.validateSync();
      expect(err?.errors['_id']).toBeDefined();
      expect(err?.errors['windowStartedAt']).toBeDefined();
      expect(err?.errors['expiresAt']).toBeDefined();
    });

    it('has TTL index on expiresAt with expireAfterSeconds: 0', () => {
      const indexes = MessageRateLimitSchema.indexes();
      const ttlIndex = indexes.find(
        ([idx, opts]) => (idx as Record<string, unknown>).expiresAt === 1 && (opts as { expireAfterSeconds?: number })?.expireAfterSeconds === 0,
      );
      expect(ttlIndex).toBeDefined();
    });
  });

  describe('10. PropertyCategory Schema (property_categories)', () => {
    const PropertyCategoryModel = mongoose.model<PropertyCategory>('CategoryTest', PropertyCategorySchema);

    it('requires key, label, and defaults icon to ⌂ and active to true', async () => {
      const doc = new PropertyCategoryModel({ key: 'VILLA', label: 'Luxury Villa' });
      expect(doc.key).toBe('villa');
      expect(doc.icon).toBe('⌂');
      expect(doc.active).toBe(true);
      expect(doc.sortOrder).toBe(0);
      expect(doc.validateSync()).toBeUndefined();
    });

    it('requires key and label', async () => {
      const doc = new PropertyCategoryModel({});
      const err = doc.validateSync();
      expect(err?.errors['key']).toBeDefined();
      expect(err?.errors['label']).toBeDefined();
    });
  });

  describe('11. AuditLog Schema (audit_logs)', () => {
    const AuditLogModel = mongoose.model<AuditLog>('AuditLogTest', AuditLogSchema);

    it('requires adminUserId, action, targetType, and targetId', async () => {
      const doc = new AuditLogModel({});
      const err = doc.validateSync();
      expect(err?.errors['adminUserId']).toBeDefined();
      expect(err?.errors['action']).toBeDefined();
      expect(err?.errors['targetType']).toBeDefined();
      expect(err?.errors['targetId']).toBeDefined();
    });

    it('accepts all 10 valid audit actions', async () => {
      const validActions = [
        'user_suspend',
        'user_reactivate',
        'property_hide',
        'property_restore',
        'property_remove',
        'report_review',
        'report_resolve',
        'report_dismiss',
        'category_update',
        'category_toggle',
      ];
      for (const action of validActions) {
        const doc = new AuditLogModel({
          adminUserId: 'admin_1',
          action: action as never,
          targetType: 'user',
          targetId: 'user_target',
        });
        expect(doc.validateSync()).toBeUndefined();
      }
    });

    it('rejects invalid action and targetType', async () => {
      const doc = new AuditLogModel({
        adminUserId: 'admin_1',
        action: 'unauthorized_action' as never,
        targetType: 'server' as never,
        targetId: 'server_1',
      });
      const err = doc.validateSync();
      expect(err?.errors['action']).toBeDefined();
      expect(err?.errors['targetType']).toBeDefined();
    });
  });
});
