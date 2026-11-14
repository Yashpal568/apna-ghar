import mongoose, { Connection, Model } from 'mongoose';
import { UserProfile, UserProfileSchema } from '../src/users/schemas/user-profile.schema';
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

const TEST_MONGO_URI = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/apna_ghar_integration_test';

describe('Real MongoDB Integration & Data Layer Acceptance', () => {
  let conn: Connection;
  let UserProfileModel: Model<UserProfile>;
  let PropertyModel: Model<Property>;
  let SavedPropertyModel: Model<SavedProperty>;
  let VisitRequestModel: Model<VisitRequest>;
  let PropertyReportModel: Model<PropertyReport>;
  let ConversationModel: Model<Conversation>;
  let MessageModel: Model<Message>;
  let PropertyOfferModel: Model<PropertyOffer>;
  let RateLimitModel: Model<MessageRateLimit>;
  let CategoryModel: Model<PropertyCategory>;
  let AuditLogModel: Model<AuditLog>;

  beforeAll(async () => {
    conn = await mongoose.createConnection(TEST_MONGO_URI).asPromise();
    await conn.dropDatabase();

    UserProfileModel = conn.model('UserProfile', UserProfileSchema);
    PropertyModel = conn.model('Property', PropertySchema);
    SavedPropertyModel = conn.model('SavedProperty', SavedPropertySchema);
    VisitRequestModel = conn.model('VisitRequest', VisitRequestSchema);
    PropertyReportModel = conn.model('PropertyReport', PropertyReportSchema);
    ConversationModel = conn.model('Conversation', ConversationSchema);
    MessageModel = conn.model('Message', MessageSchema);
    PropertyOfferModel = conn.model('PropertyOffer', PropertyOfferSchema);
    RateLimitModel = conn.model('MessageRateLimit', MessageRateLimitSchema);
    CategoryModel = conn.model('PropertyCategory', PropertyCategorySchema);
    AuditLogModel = conn.model('AuditLog', AuditLogSchema);

    // Sync all indexes with real MongoDB server
    await Promise.all([
      UserProfileModel.syncIndexes(),
      PropertyModel.syncIndexes(),
      SavedPropertyModel.syncIndexes(),
      VisitRequestModel.syncIndexes(),
      PropertyReportModel.syncIndexes(),
      ConversationModel.syncIndexes(),
      MessageModel.syncIndexes(),
      PropertyOfferModel.syncIndexes(),
      RateLimitModel.syncIndexes(),
      CategoryModel.syncIndexes(),
      AuditLogModel.syncIndexes(),
    ]);
  });

  afterAll(async () => {
    if (conn && conn.readyState === 1) {
      try {
        await conn.dropDatabase();
        await conn.close();
      } catch {
        // already closed
      }
    }
  }, 15000);

  it('1. Connects to real MongoDB and registers all 11 Mongoose collections', async () => {
    expect(conn.readyState).toBe(1); // 1 = connected
    const collections = await conn.db?.listCollections().toArray();
    const collectionNames = collections?.map((c) => c.name) || [];

    const expectedCollections = [
      'user_profiles',
      'properties',
      'saved_properties',
      'visit_requests',
      'property_reports',
      'conversations',
      'messages',
      'property_offers',
      'message_rate_limits',
      'property_categories',
      'audit_logs',
    ];

    for (const name of expectedCollections) {
      expect(collectionNames).toContain(name);
    }
  });

  it('2. Verifies actual MongoDB indexes and unique constraints on collections', async () => {
    // 2.1 UserProfile unique clerkUserId index
    const userIndexes = await UserProfileModel.collection.indexes();
    const clerkIdx = userIndexes.find((idx) => idx.name === 'clerkUserId_1');
    expect(clerkIdx?.unique).toBe(true);

    // 2.2 Property unique slug index and compound search indexes
    const propIndexes = await PropertyModel.collection.indexes();
    const slugIdx = propIndexes.find((idx) => idx.name === 'slug_1');
    expect(slugIdx?.unique).toBe(true);
    const cityStatusIdx = propIndexes.find((idx) => idx.name?.includes('location.city_1'));
    expect(cityStatusIdx).toBeDefined();

    // 2.3 SavedProperty compound unique index { userId: 1, propertyId: 1 }
    const savedIndexes = await SavedPropertyModel.collection.indexes();
    const savedUnique = savedIndexes.find((idx) => idx.name === 'userId_1_propertyId_1');
    expect(savedUnique?.unique).toBe(true);

    // 2.4 Conversation compound unique index { propertyId: 1, buyerId: 1 }
    const convIndexes = await ConversationModel.collection.indexes();
    const convUnique = convIndexes.find((idx) => idx.name === 'propertyId_1_buyerId_1');
    expect(convUnique?.unique).toBe(true);

    // 2.5 Message keyset index { conversationId: 1, sentAt: -1, _id: -1 }
    const msgIndexes = await MessageModel.collection.indexes();
    const msgKeyset = msgIndexes.find((idx) => idx.name?.includes('conversationId_1_sentAt_-1'));
    expect(msgKeyset).toBeDefined();

    // 2.6 MessageRateLimit TTL index { expiresAt: 1 } with expireAfterSeconds: 0
    const rateIndexes = await RateLimitModel.collection.indexes();
    const ttlIdx = rateIndexes.find((idx) => idx.name === 'expiresAt_1');
    expect(ttlIdx?.expireAfterSeconds).toBe(0);
  });

  it('3. Persists UserProfile and enforces unique constraint in MongoDB', async () => {
    const user = await UserProfileModel.create({
      clerkUserId: 'user_live_001',
      name: 'Integration Tester',
      email: 'test@apnaghar.in',
      role: 'USER',
      accountStatus: 'active',
    });
    expect(user._id).toBeDefined();

    // Attempting duplicate clerkUserId must throw Mongo duplicate key error (11000)
    await expect(
      UserProfileModel.create({
        clerkUserId: 'user_live_001',
        name: 'Imposter User',
        email: 'imposter@apnaghar.in',
      }),
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('4. Persists Property and validates nested location document and slug uniqueness', async () => {
    const prop = await PropertyModel.create({
      ownerId: 'user_live_001',
      title: 'Green Valley Penthouse',
      slug: 'green-valley-penthouse-101',
      description: 'Stunning 4BHK penthouse with panoramic views',
      categoryId: 'apartment',
      listingType: 'sale',
      priceAmount: 18500000,
      areaValue: 2400,
      areaUnit: 'sqft',
      location: {
        state: 'Punjab',
        city: 'Amritsar',
        locality: 'Ranjit Avenue',
        addressText: 'Tower B, Suite 1204',
      },
      status: 'active',
    });
    expect(prop._id).toBeDefined();
    expect(prop.location.city).toBe('Amritsar');

    // Attempting duplicate slug must be rejected by MongoDB
    await expect(
      PropertyModel.create({
        ownerId: 'user_live_002',
        title: 'Another Penthouse',
        slug: 'green-valley-penthouse-101',
        description: 'Duplicate slug test',
        categoryId: 'apartment',
        listingType: 'sale',
        priceAmount: 12000000,
        areaValue: 1500,
        areaUnit: 'sqft',
        location: { state: 'Punjab', city: 'Amritsar' },
      }),
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('5. Enforces SavedProperty compound unique constraint { userId: 1, propertyId: 1 } in MongoDB', async () => {
    const saved = await SavedPropertyModel.create({
      userId: 'user_live_001',
      propertyId: '507f1f77bcf86cd799439011',
    });
    expect(saved._id).toBeDefined();

    // Duplicate save must be rejected by MongoDB
    await expect(
      SavedPropertyModel.create({
        userId: 'user_live_001',
        propertyId: '507f1f77bcf86cd799439011',
      }),
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('6. Enforces Conversation unique thread constraint { propertyId: 1, buyerId: 1 } in MongoDB', async () => {
    const conv = await ConversationModel.create({
      propertyId: '507f1f77bcf86cd799439011',
      propertyTitle: 'Green Valley Penthouse',
      propertySlug: 'green-valley-penthouse-101',
      ownerId: 'user_live_001',
      buyerId: 'user_live_buyer',
      participantIds: ['user_live_001', 'user_live_buyer'],
    });
    expect(conv._id).toBeDefined();

    // Duplicate conversation for same buyer and property must be rejected
    await expect(
      ConversationModel.create({
        propertyId: '507f1f77bcf86cd799439011',
        propertyTitle: 'Green Valley Penthouse',
        propertySlug: 'green-valley-penthouse-101',
        ownerId: 'user_live_001',
        buyerId: 'user_live_buyer',
        participantIds: ['user_live_001', 'user_live_buyer'],
      }),
    ).rejects.toThrow(/E11000 duplicate key error/);
  });

  it('7. Persists Messages, Offers, VisitRequests, Reports, Categories, and AuditLogs', async () => {
    const convId = new mongoose.Types.ObjectId();

    // 7.1 Message persistence
    const msg = await MessageModel.create({
      conversationId: convId,
      senderId: 'user_live_buyer',
      text: 'What is the negotiable price?',
      sentAt: new Date(),
    });
    expect(msg._id).toBeDefined();

    // 7.2 PropertyOffer persistence
    const offer = await PropertyOfferModel.create({
      conversationId: convId,
      propertyId: '507f1f77bcf86cd799439011',
      buyerId: 'user_live_buyer',
      ownerId: 'user_live_001',
      senderId: 'user_live_buyer',
      recipientId: 'user_live_001',
      amount: 18000000,
      askingPriceAtOffer: 18500000,
      status: 'pending',
    });
    expect(offer._id).toBeDefined();
    expect(offer.status).toBe('pending');

    // 7.3 VisitRequest persistence
    const vr = await VisitRequestModel.create({
      userId: 'user_live_buyer',
      propertyId: '507f1f77bcf86cd799439011',
      preferredDate: '2026-11-20',
      preferredTime: '15:30',
      status: 'requested',
    });
    expect(vr._id).toBeDefined();

    // 7.4 PropertyReport persistence
    const rep = await PropertyReportModel.create({
      reporterId: 'user_live_buyer',
      propertyId: '507f1f77bcf86cd799439011',
      reason: 'misleading',
      details: 'Price differs from advertisement',
      status: 'open',
    });
    expect(rep._id).toBeDefined();

    // 7.5 PropertyCategory persistence
    const cat = await CategoryModel.create({
      key: 'penthouse',
      label: 'Luxury Penthouse',
      icon: '🏛',
      sortOrder: 5,
    });
    expect(cat.key).toBe('penthouse');

    // 7.6 AuditLog persistence
    const audit = await AuditLogModel.create({
      adminUserId: 'admin_live_1',
      action: 'property_hide',
      targetType: 'property',
      targetId: '507f1f77bcf86cd799439011',
      reason: 'Under review for compliance',
    });
    expect(audit._id).toBeDefined();
    expect(audit.action).toBe('property_hide');
  });

  it('8. Verifies Application Restart Persistence across reconnect', async () => {
    // Disconnect from MongoDB
    await conn.close();
    expect(conn.readyState).toBe(0); // disconnected

    // Reconnect to the same database
    conn = await mongoose.createConnection(TEST_MONGO_URI).asPromise();
    expect(conn.readyState).toBe(1);

    const NewPropertyModel = conn.model('Property', PropertySchema);
    const existing = await NewPropertyModel.findOne({ slug: 'green-valley-penthouse-101' });
    expect(existing).toBeDefined();
    expect(existing?.title).toBe('Green Valley Penthouse');
    expect(existing?.priceAmount).toBe(18500000);
  });
});
