import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { auth, db, storage } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  AnimalListing,
  AppSettings,
  CategoryConfig,
  EnquiryItem,
  FavouriteItem,
  NotificationItem,
  ReportItem,
  ReviewItem,
  SellerSummary,
  UserProfile,
} from '../types';
import {
  ADMIN_EMAIL,
  DEFAULT_CATEGORIES,
  STARTER_LISTINGS,
  STARTER_SELLERS,
} from '../utils/constants';
import { BLUEPRINT_LIMITS, sanitizeListingPayload } from '../utils/validation';

function toIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (val && typeof (val as { toDate?: () => Date }).toDate === 'function') {
    return (val as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function mapAnimalDoc(id: string, data: Record<string, unknown>): AnimalListing {
  return {
    listingId: String(data.listingId || id),
    sellerId: String(data.sellerId || ''),
    sellerName: String(data.sellerName || ''),
    sellerPhoto: String(data.sellerPhoto || ''),
    sellerVerified: Boolean(data.sellerVerified),
    category: (data.category as AnimalListing['category']) || 'Cow',
    breed: String(data.breed || ''),
    age: String(data.age || ''),
    gender: (data.gender as AnimalListing['gender']) || 'Female',
    color: String(data.color || ''),
    weight: String(data.weight || ''),
    milkCapacity: String(data.milkCapacity || ''),
    healthStatus: String(data.healthStatus || ''),
    vaccinationStatus: String(data.vaccinationStatus || ''),
    pregnancyStatus: String(data.pregnancyStatus || ''),
    description: String(data.description || ''),
    price: Number(data.price || 0),
    negotiable: Boolean(data.negotiable),
    photos: Array.isArray(data.photos) ? data.photos.map(String) : [],
    videoURL: String(data.videoURL || ''),
    state: String(data.state || ''),
    district: String(data.district || ''),
    village: String(data.village || ''),
    locationDescription: String(data.locationDescription || ''),
    contactNumber: String(data.contactNumber || ''),
    whatsappEnabled: Boolean(data.whatsappEnabled),
    status: (data.status as AnimalListing['status']) || 'ACTIVE',
    featured: Boolean(data.featured),
    views: Number(data.views || 0),
    publishedAt: toIso(data.publishedAt),
    updatedAt: toIso(data.updatedAt),
  };
}

function mapUserDoc(id: string, data: Record<string, unknown>): UserProfile {
  return {
    uid: String(data.uid || id),
    name: String(data.name || ''),
    phone: String(data.phone || ''),
    email: String(data.email || ''),
    state: String(data.state || ''),
    district: String(data.district || ''),
    village: String(data.village || ''),
    photoURL: String(data.photoURL || ''),
    verified: Boolean(data.verified),
    suspended: Boolean(data.suspended),
    role: data.role === 'admin' ? 'admin' : 'user',
    language: data.language === 'hi' ? 'hi' : 'en',
    termsAccepted: Boolean(data.termsAccepted),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  };
}

export function generateFirestoreId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function compressImageToDataUrl(
  file: File,
  maxDimension = 800,
  maxChars = 150000
): Promise<string> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width || maxDimension;
        let height = img.naturalHeight || img.height || maxDimension;
        const longest = Math.max(width, height);
        if (longest > maxDimension) {
          const scale = maxDimension / longest;
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Canvas context unavailable for image compression.'));
          return;
        }

        let currentW = width;
        let currentH = height;
        let result = '';

        for (let pass = 0; pass < 4; pass += 1) {
          canvas.width = currentW;
          canvas.height = currentH;
          ctx.clearRect(0, 0, currentW, currentH);
          ctx.drawImage(img, 0, 0, currentW, currentH);
          const qualities = [0.76, 0.62, 0.48, 0.36];
          for (const q of qualities) {
            result = canvas.toDataURL('image/jpeg', q);
            if (result.length <= maxChars) {
              URL.revokeObjectURL(objectUrl);
              resolve(result);
              return;
            }
          }
          currentW = Math.max(240, Math.round(currentW * 0.72));
          currentH = Math.max(240, Math.round(currentH * 0.72));
        }

        URL.revokeObjectURL(objectUrl);
        resolve(result);
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Unable to read selected image file.'));
    };
    img.src = objectUrl;
  });
}

export async function uploadMediaFile(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void,
  timeoutMs = 10000
): Promise<string> {
  const storageRef = ref(storage, storagePath);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, file);
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        try {
          task.cancel();
        } catch {
          // Ignore cancel errors
        }
        reject(new Error('Cloud storage upload timed out.'));
      }
    }, timeoutMs);

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 90));
        }
      },
      (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(error);
        }
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref);
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            if (onProgress) onProgress(100);
            resolve(url);
          }
        } catch (err) {
          if (!settled) {
            settled = true;
            clearTimeout(timer);
            reject(err);
          }
        }
      }
    );
  });
}

export async function uploadImageSmart(
  file: File,
  storagePath: string,
  onProgress?: (percent: number) => void,
  maxFallbackChars = 150000
): Promise<string> {
  try {
    return await uploadMediaFile(file, storagePath, onProgress, 7000);
  } catch {
    if (onProgress) onProgress(55);
    const dataUrl = await compressImageToDataUrl(file, 800, maxFallbackChars);
    if (onProgress) onProgress(100);
    return dataUrl;
  }
}

export function formatReadableFirebaseError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || '');
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed && typeof parsed.error === 'string') {
      if (parsed.error.includes('Missing or insufficient permissions')) {
        return 'Permission denied while saving to Firestore. Please make sure you are signed in with a verified Google or Mobile OTP account and all required fields are filled.';
      }
      return parsed.error;
    }
  } catch {
    // Plain string error
  }
  if (raw.includes('Missing or insufficient permissions') || raw.includes('PERMISSION_DENIED')) {
    return 'Permission denied while saving. Please verify you are signed in and try again.';
  }
  if (raw.includes('the client is offline')) {
    return 'Unable to reach Firestore server. Please check your internet connection.';
  }
  return raw || 'Something went wrong while saving.';
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return mapUserDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function checkIsAdminUser(uid: string, email?: string | null, emailVerified?: boolean): Promise<boolean> {
  if (email === ADMIN_EMAIL && emailVerified) return true;
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export async function createUserProfile(input: {
  uid: string;
  name: string;
  phone: string;
  email: string;
  state: string;
  district: string;
  village: string;
  photoURL: string;
  language: 'en' | 'hi';
}): Promise<UserProfile> {
  const userPath = `users/${input.uid}`;
  const sellerPath = `sellers/${input.uid}`;
  const safeName = sanitizeListingPayload(input.name, BLUEPRINT_LIMITS.nameMax);
  const safeState = sanitizeListingPayload(input.state, BLUEPRINT_LIMITS.stateMax);
  const safeDistrict = sanitizeListingPayload(input.district, BLUEPRINT_LIMITS.districtMax);
  const safeVillage = sanitizeListingPayload(input.village, BLUEPRINT_LIMITS.villageMax);
  const safePhone = sanitizeListingPayload(input.phone, BLUEPRINT_LIMITS.phoneMax);
  const safeEmail = sanitizeListingPayload(input.email, 160);
  const safePhoto = sanitizeListingPayload(input.photoURL, 120000);

  try {
    await setDoc(doc(db, 'users', input.uid), {
      uid: input.uid,
      name: safeName,
      phone: safePhone,
      email: safeEmail,
      state: safeState,
      district: safeDistrict,
      village: safeVillage,
      photoURL: safePhoto,
      verified: false,
      suspended: false,
      role: 'user',
      language: input.language,
      termsAccepted: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(db, 'sellers', input.uid), {
      uid: input.uid,
      name: safeName,
      photoURL: safePhoto,
      state: safeState,
      district: safeDistrict,
      village: safeVillage,
      verified: false,
      suspended: false,
      memberSince: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = await getUserProfile(input.uid);
    if (!created) throw new Error('Profile creation could not be confirmed.');
    return created;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath || sellerPath);
  }
}

export async function updateUserProfile(
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'email' | 'state' | 'district' | 'village' | 'photoURL' | 'language'>>
): Promise<void> {
  const userPath = `users/${uid}`;
  const sanitizedUser: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const sanitizedSeller: Record<string, unknown> = { updatedAt: serverTimestamp() };

  if (updates.name !== undefined) {
    const val = sanitizeListingPayload(updates.name, BLUEPRINT_LIMITS.nameMax);
    sanitizedUser.name = val;
    sanitizedSeller.name = val;
  }
  if (updates.phone !== undefined) sanitizedUser.phone = sanitizeListingPayload(updates.phone, BLUEPRINT_LIMITS.phoneMax);
  if (updates.email !== undefined) sanitizedUser.email = sanitizeListingPayload(updates.email, 160);
  if (updates.state !== undefined) {
    const val = sanitizeListingPayload(updates.state, BLUEPRINT_LIMITS.stateMax);
    sanitizedUser.state = val;
    sanitizedSeller.state = val;
  }
  if (updates.district !== undefined) {
    const val = sanitizeListingPayload(updates.district, BLUEPRINT_LIMITS.districtMax);
    sanitizedUser.district = val;
    sanitizedSeller.district = val;
  }
  if (updates.village !== undefined) {
    const val = sanitizeListingPayload(updates.village, BLUEPRINT_LIMITS.villageMax);
    sanitizedUser.village = val;
    sanitizedSeller.village = val;
  }
  if (updates.photoURL !== undefined) {
    const val = sanitizeListingPayload(updates.photoURL, 120000);
    sanitizedUser.photoURL = val;
    sanitizedSeller.photoURL = val;
  }
  if (updates.language !== undefined) sanitizedUser.language = updates.language;

  try {
    await updateDoc(doc(db, 'users', uid), sanitizedUser);
    if (Object.keys(sanitizedSeller).length > 1) {
      await updateDoc(doc(db, 'sellers', uid), sanitizedSeller);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, userPath);
  }
}

export function subscribeActiveListings(
  onData: (listings: AnimalListing[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const q = query(
    collection(db, 'animals'),
    where('status', '==', 'ACTIVE'),
    limit(100)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapAnimalDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      onData(items);
    },
    (error) => {
      onError(error);
    }
  );
}

export function subscribeSellerListings(
  sellerId: string,
  onData: (listings: AnimalListing[]) => void
): Unsubscribe {
  const path = 'animals';
  const q = query(
    collection(db, 'animals'),
    where('sellerId', '==', sellerId)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => mapAnimalDoc(d.id, d.data() as Record<string, unknown>))
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function getListingById(listingId: string): Promise<AnimalListing | null> {
  const path = `animals/${listingId}`;
  try {
    const snap = await getDoc(doc(db, 'animals', listingId));
    if (!snap.exists()) return null;
    return mapAnimalDoc(snap.id, snap.data() as Record<string, unknown>);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function incrementListingViews(listing: AnimalListing): Promise<void> {
  if (listing.isDemo || !auth.currentUser) return;
  try {
    await updateDoc(doc(db, 'animals', listing.listingId), {
      views: (listing.views || 0) + 1,
    });
  } catch {
    // Non-critical telemetry increment
  }
}

export async function publishAnimalListing(
  input: Omit<
    AnimalListing,
    'listingId' | 'sellerId' | 'sellerVerified' | 'status' | 'featured' | 'views' | 'publishedAt' | 'updatedAt'
  >,
  listingId?: string
): Promise<AnimalListing> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Authentication required to publish listing.');

  const id = listingId || generateFirestoreId('lst');
  const path = `animals/${id}`;
  const payload = {
    listingId: id,
    sellerId: currentUser.uid,
    sellerName: sanitizeListingPayload(input.sellerName, BLUEPRINT_LIMITS.nameMax),
    sellerPhoto: sanitizeListingPayload(input.sellerPhoto || '', 120000),
    sellerVerified: false,
    category: input.category,
    breed: sanitizeListingPayload(input.breed, BLUEPRINT_LIMITS.breedMax),
    age: sanitizeListingPayload(input.age, BLUEPRINT_LIMITS.ageMax),
    gender: input.gender,
    color: sanitizeListingPayload(input.color, BLUEPRINT_LIMITS.colorMax),
    weight: sanitizeListingPayload(input.weight || '', 40),
    milkCapacity: sanitizeListingPayload(input.milkCapacity || '', 40),
    healthStatus: sanitizeListingPayload(input.healthStatus, BLUEPRINT_LIMITS.healthMax),
    vaccinationStatus: sanitizeListingPayload(input.vaccinationStatus, BLUEPRINT_LIMITS.vaccinationMax),
    pregnancyStatus: sanitizeListingPayload(input.pregnancyStatus || '', 80),
    description: sanitizeListingPayload(input.description, BLUEPRINT_LIMITS.descriptionMax),
    price: Number(input.price),
    negotiable: Boolean(input.negotiable),
    photos: input.photos.slice(0, 10),
    videoURL: sanitizeListingPayload(input.videoURL || '', 1024),
    state: sanitizeListingPayload(input.state, BLUEPRINT_LIMITS.stateMax),
    district: sanitizeListingPayload(input.district, BLUEPRINT_LIMITS.districtMax),
    village: sanitizeListingPayload(input.village, BLUEPRINT_LIMITS.villageMax),
    locationDescription: sanitizeListingPayload(input.locationDescription || '', BLUEPRINT_LIMITS.locationDescMax),
    contactNumber: sanitizeListingPayload(input.contactNumber, BLUEPRINT_LIMITS.phoneMax),
    whatsappEnabled: Boolean(input.whatsappEnabled),
    status: 'ACTIVE' as const,
    featured: false,
    views: 0,
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'animals', id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  try {
    await createNotification({
      userId: currentUser.uid,
      type: 'LISTING_PUBLISHED',
      title: 'Listing Published (Public)',
      body: `Your ${payload.breed} ${payload.category} advertisement is now live & public on Pashu Market.`,
      relatedId: id,
    });
  } catch {
    // Non-critical notification; listing is already published
  }

  const fetched = await getListingById(id).catch(() => null);
  if (fetched) return fetched;

  const nowIso = new Date().toISOString();
  return {
    ...payload,
    publishedAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function updateOwnerListing(
  listingId: string,
  updates: Partial<AnimalListing>
): Promise<void> {
  const path = `animals/${listingId}`;
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  const allowedKeys = [
    'sellerName',
    'sellerPhoto',
    'category',
    'breed',
    'age',
    'gender',
    'color',
    'weight',
    'milkCapacity',
    'healthStatus',
    'vaccinationStatus',
    'pregnancyStatus',
    'description',
    'price',
    'negotiable',
    'photos',
    'videoURL',
    'state',
    'district',
    'village',
    'locationDescription',
    'contactNumber',
    'whatsappEnabled',
    'status',
  ] as const;

  for (const key of allowedKeys) {
    if (updates[key] !== undefined) {
      payload[key] = updates[key];
    }
  }

  try {
    await updateDoc(doc(db, 'animals', listingId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }

  try {
    if (auth.currentUser && updates.status === 'SOLD') {
      await createNotification({
        userId: auth.currentUser.uid,
        type: 'LISTING_SOLD',
        title: 'Animal Marked Sold',
        body: 'Congratulations! Your livestock listing was marked as SOLD.',
        relatedId: listingId,
      });
    } else if (auth.currentUser) {
      await createNotification({
        userId: auth.currentUser.uid,
        type: 'LISTING_UPDATED',
        title: 'Listing Updated',
        body: 'Your animal listing details were updated.',
        relatedId: listingId,
      });
    }
  } catch {
    // Non-critical notification
  }
}

export async function deleteListing(listingId: string): Promise<void> {
  const path = `animals/${listingId}`;
  try {
    await deleteDoc(doc(db, 'animals', listingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeFavourites(
  userId: string,
  onData: (items: FavouriteItem[]) => void
): Unsubscribe {
  const path = 'favourites';
  const q = query(collection(db, 'favourites'), where('userId', '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            favouriteId: String(data.favouriteId || d.id),
            userId: String(data.userId || ''),
            listingId: String(data.listingId || ''),
            createdAt: toIso(data.createdAt),
          };
        })
      );
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function toggleFavouriteListing(
  userId: string,
  listingId: string,
  currentlySaved: boolean
): Promise<void> {
  const favouriteId = `${userId}_${listingId}`;
  const path = `favourites/${favouriteId}`;
  try {
    if (currentlySaved) {
      await deleteDoc(doc(db, 'favourites', favouriteId));
    } else {
      await setDoc(doc(db, 'favourites', favouriteId), {
        favouriteId,
        userId,
        listingId,
        createdAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, currentlySaved ? OperationType.DELETE : OperationType.CREATE, path);
  }
}

export async function sendEnquiry(input: {
  listing: AnimalListing;
  buyer: UserProfile;
  message: string;
  contactRequested: boolean;
}): Promise<EnquiryItem> {
  const enquiryId = generateFirestoreId('enq');
  const path = `enquiries/${enquiryId}`;
  const payload = {
    enquiryId,
    listingId: input.listing.listingId,
    listingTitle: sanitizeListingPayload(`${input.listing.breed} ${input.listing.category}`, 160),
    listingPhoto: sanitizeListingPayload(input.listing.photos[0] || '', 250000),
    buyerId: input.buyer.uid,
    buyerName: sanitizeListingPayload(input.buyer.name, BLUEPRINT_LIMITS.nameMax),
    buyerPhone: input.contactRequested ? sanitizeListingPayload(input.buyer.phone || '', 20) : '',
    sellerId: input.listing.sellerId,
    sellerName: sanitizeListingPayload(input.listing.sellerName, BLUEPRINT_LIMITS.nameMax),
    message: sanitizeListingPayload(input.message, BLUEPRINT_LIMITS.enquiryMsgMax),
    reply: '',
    contactRequested: input.contactRequested,
    status: 'OPEN',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, 'enquiries', enquiryId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  try {
    await createNotification({
      userId: input.listing.sellerId,
      type: 'NEW_ENQUIRY',
      title: `New Enquiry: ${payload.listingTitle}`,
      body: `${input.buyer.name} sent an enquiry: "${payload.message.slice(0, 80)}"`,
      relatedId: enquiryId,
    });
  } catch {
    // Non-critical notification
  }

  return {
    ...payload,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function subscribeUserEnquiries(
  userId: string,
  role: 'buyer' | 'seller',
  onData: (items: EnquiryItem[]) => void
): Unsubscribe {
  const path = 'enquiries';
  const field = role === 'seller' ? 'sellerId' : 'buyerId';
  const q = query(collection(db, 'enquiries'), where(field, '==', userId));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            enquiryId: String(data.enquiryId || d.id),
            listingId: String(data.listingId || ''),
            listingTitle: String(data.listingTitle || ''),
            listingPhoto: String(data.listingPhoto || ''),
            buyerId: String(data.buyerId || ''),
            buyerName: String(data.buyerName || ''),
            buyerPhone: String(data.buyerPhone || ''),
            sellerId: String(data.sellerId || ''),
            sellerName: String(data.sellerName || ''),
            message: String(data.message || ''),
            reply: String(data.reply || ''),
            contactRequested: Boolean(data.contactRequested),
            status: (data.status as EnquiryItem['status']) || 'OPEN',
            createdAt: toIso(data.createdAt),
            updatedAt: toIso(data.updatedAt),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function replyToEnquiry(
  enquiry: EnquiryItem,
  reply: string,
  nextStatus: 'REPLIED' | 'RESOLVED' = 'REPLIED'
): Promise<void> {
  const path = `enquiries/${enquiry.enquiryId}`;
  try {
    await updateDoc(doc(db, 'enquiries', enquiry.enquiryId), {
      reply: sanitizeListingPayload(reply, BLUEPRINT_LIMITS.enquiryMsgMax),
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });
    if (reply.trim()) {
      await createNotification({
        userId: enquiry.buyerId,
        type: 'NEW_MESSAGE',
        title: `Seller Reply: ${enquiry.listingTitle}`,
        body: sanitizeListingPayload(reply, 160),
        relatedId: enquiry.enquiryId,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function resolveEnquiryAsBuyer(enquiryId: string): Promise<void> {
  const path = `enquiries/${enquiryId}`;
  try {
    await updateDoc(doc(db, 'enquiries', enquiryId), {
      status: 'RESOLVED',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function createNotification(input: {
  userId: string;
  type: NotificationItem['type'];
  title: string;
  body: string;
  relatedId?: string;
}): Promise<void> {
  const senderId = auth.currentUser?.uid;
  if (!senderId) return;
  const notificationId = generateFirestoreId('ntf');
  const path = `notifications/${notificationId}`;
  try {
    await setDoc(doc(db, 'notifications', notificationId), {
      notificationId,
      userId: input.userId,
      senderId,
      type: input.type,
      title: sanitizeListingPayload(input.title, 160),
      body: sanitizeListingPayload(input.body, 600),
      relatedId: sanitizeListingPayload(input.relatedId || '', 128),
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeNotifications(
  userId: string,
  onData: (items: NotificationItem[]) => void
): Unsubscribe {
  const path = 'notifications';
  const qPersonal = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    limit(50)
  );
  return onSnapshot(
    qPersonal,
    (snapshot) => {
      const items = snapshot.docs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            notificationId: String(data.notificationId || d.id),
            userId: String(data.userId || ''),
            senderId: String(data.senderId || ''),
            type: (data.type as NotificationItem['type']) || 'LISTING_UPDATED',
            title: String(data.title || ''),
            body: String(data.body || ''),
            relatedId: String(data.relatedId || ''),
            read: Boolean(data.read),
            createdAt: toIso(data.createdAt),
          };
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const path = `notifications/${notificationId}`;
  try {
    await updateDoc(doc(db, 'notifications', notificationId), { read: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function submitListingReport(input: {
  listing: AnimalListing;
  reason: string;
  details: string;
}): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Sign in required to submit a report.');
  const reportId = generateFirestoreId('rpt');
  const path = `reports/${reportId}`;
  try {
    await setDoc(doc(db, 'reports', reportId), {
      reportId,
      listingId: input.listing.listingId,
      listingTitle: sanitizeListingPayload(`${input.listing.breed} ${input.listing.category}`, 160),
      reporterId: uid,
      reason: sanitizeListingPayload(input.reason, 120),
      details: sanitizeListingPayload(input.details, 1000),
      status: 'OPEN',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function fetchPublicSellers(): Promise<SellerSummary[]> {
  try {
    const q = query(collection(db, 'sellers'), where('suspended', '==', false), limit(20));
    const snap = await getDocs(q);
    if (snap.empty) return STARTER_SELLERS;
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        uid: String(data.uid || d.id),
        name: String(data.name || ''),
        photoURL: String(data.photoURL || ''),
        state: String(data.state || ''),
        district: String(data.district || ''),
        village: String(data.village || ''),
        verified: Boolean(data.verified),
        suspended: Boolean(data.suspended),
        memberSince: toIso(data.memberSince),
        updatedAt: toIso(data.updatedAt),
      };
    });
  } catch {
    return STARTER_SELLERS;
  }
}

export async function fetchCategories(): Promise<CategoryConfig[]> {
  try {
    const q = query(collection(db, 'categories'), where('active', '==', true));
    const snap = await getDocs(q);
    if (snap.empty) return DEFAULT_CATEGORIES;
    return snap.docs
      .map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          categoryId: String(data.categoryId || d.id),
          nameEn: data.nameEn as CategoryConfig['nameEn'],
          nameHi: String(data.nameHi || ''),
          slug: String(data.slug || ''),
          order: Number(data.order || 0),
          active: Boolean(data.active),
          imageUrl: String(data.imageUrl || ''),
          updatedAt: toIso(data.updatedAt),
        };
      })
      .sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export async function fetchGlobalSettings(): Promise<AppSettings | null> {
  try {
    const snap = await getDoc(doc(db, 'appSettings', 'global'));
    if (!snap.exists()) return null;
    const data = snap.data() as Record<string, unknown>;
    return {
      settingId: 'global',
      announcementTitle: String(data.announcementTitle || ''),
      announcementBody: String(data.announcementBody || ''),
      announcementActive: Boolean(data.announcementActive),
      supportPhone: String(data.supportPhone || '+91 1800-202-7274'),
      supportEmail: String(data.supportEmail || 'support@pashumarket.in'),
      updatedAt: toIso(data.updatedAt),
    };
  } catch {
    return null;
  }
}

export async function fetchSellerReviews(sellerId: string): Promise<ReviewItem[]> {
  try {
    const q = query(collection(db, 'reviews'), where('sellerId', '==', sellerId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        reviewId: String(data.reviewId || d.id),
        sellerId: String(data.sellerId || ''),
        reviewerId: String(data.reviewerId || ''),
        reviewerName: String(data.reviewerName || ''),
        listingId: String(data.listingId || ''),
        rating: Number(data.rating || 5),
        comment: String(data.comment || ''),
        createdAt: toIso(data.createdAt),
      };
    });
  } catch {
    return [];
  }
}

// --- Admin Operations ---

export async function fetchAdminDashboardData(): Promise<{
  users: UserProfile[];
  listings: AnimalListing[];
  reports: ReportItem[];
  enquiries: EnquiryItem[];
  categories: CategoryConfig[];
}> {
  try {
    const [usersSnap, listingsSnap, reportsSnap, enquiriesSnap, categoriesSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'animals')),
      getDocs(collection(db, 'reports')),
      getDocs(collection(db, 'enquiries')),
      getDocs(collection(db, 'categories')),
    ]);

    return {
      users: usersSnap.docs.map((d) => mapUserDoc(d.id, d.data() as Record<string, unknown>)),
      listings: listingsSnap.docs.map((d) => mapAnimalDoc(d.id, d.data() as Record<string, unknown>)),
      reports: reportsSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          reportId: String(data.reportId || d.id),
          listingId: String(data.listingId || ''),
          listingTitle: String(data.listingTitle || ''),
          reporterId: String(data.reporterId || ''),
          reason: String(data.reason || ''),
          details: String(data.details || ''),
          status: (data.status as ReportItem['status']) || 'OPEN',
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
        };
      }),
      enquiries: enquiriesSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          enquiryId: String(data.enquiryId || d.id),
          listingId: String(data.listingId || ''),
          listingTitle: String(data.listingTitle || ''),
          listingPhoto: String(data.listingPhoto || ''),
          buyerId: String(data.buyerId || ''),
          buyerName: String(data.buyerName || ''),
          buyerPhone: String(data.buyerPhone || ''),
          sellerId: String(data.sellerId || ''),
          sellerName: String(data.sellerName || ''),
          message: String(data.message || ''),
          reply: String(data.reply || ''),
          contactRequested: Boolean(data.contactRequested),
          status: (data.status as EnquiryItem['status']) || 'OPEN',
          createdAt: toIso(data.createdAt),
          updatedAt: toIso(data.updatedAt),
        };
      }),
      categories: categoriesSnap.empty
        ? DEFAULT_CATEGORIES
        : categoriesSnap.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            return {
              categoryId: String(data.categoryId || d.id),
              nameEn: data.nameEn as CategoryConfig['nameEn'],
              nameHi: String(data.nameHi || ''),
              slug: String(data.slug || ''),
              order: Number(data.order || 0),
              active: Boolean(data.active),
              imageUrl: String(data.imageUrl || ''),
              updatedAt: toIso(data.updatedAt),
            };
          }),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'admin_dashboard');
  }
}

export async function adminToggleUserVerify(uid: string, verified: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { verified, updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'sellers', uid), { verified, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function adminToggleUserSuspend(uid: string, suspended: boolean): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), { suspended, updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'sellers', uid), { suspended, updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function adminUpdateListing(
  listingId: string,
  updates: Partial<Pick<AnimalListing, 'status' | 'featured' | 'sellerVerified'>>
): Promise<void> {
  try {
    await updateDoc(doc(db, 'animals', listingId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `animals/${listingId}`);
  }
}

export async function adminUpdateReportStatus(
  reportId: string,
  status: ReportItem['status']
): Promise<void> {
  try {
    await updateDoc(doc(db, 'reports', reportId), {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reports/${reportId}`);
  }
}

export async function adminSaveCategory(category: Omit<CategoryConfig, 'updatedAt'>): Promise<void> {
  try {
    await setDoc(doc(db, 'categories', category.categoryId), {
      ...category,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `categories/${category.categoryId}`);
  }
}

export async function adminSaveAnnouncement(settings: Omit<AppSettings, 'settingId' | 'updatedAt'>): Promise<void> {
  try {
    await setDoc(doc(db, 'appSettings', 'global'), {
      settingId: 'global',
      ...settings,
      updatedAt: serverTimestamp(),
    });
    if (settings.announcementActive && settings.announcementTitle) {
      await createNotification({
        userId: 'ALL',
        type: 'ADMIN_ANNOUNCEMENT',
        title: settings.announcementTitle,
        body: settings.announcementBody,
        relatedId: 'global',
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'appSettings/global');
  }
}

export async function adminSeedStarterCatalog(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Admin login required.');
  for (const cat of DEFAULT_CATEGORIES) {
    await setDoc(doc(db, 'categories', cat.categoryId), {
      categoryId: cat.categoryId,
      nameEn: cat.nameEn,
      nameHi: cat.nameHi,
      slug: cat.slug,
      order: cat.order,
      active: cat.active,
      imageUrl: cat.imageUrl,
      updatedAt: serverTimestamp(),
    });
  }

  for (const item of STARTER_LISTINGS) {
    await setDoc(doc(db, 'animals', item.listingId), {
      listingId: item.listingId,
      sellerId: uid,
      sellerName: item.sellerName,
      sellerPhoto: item.sellerPhoto,
      sellerVerified: false,
      category: item.category,
      breed: item.breed,
      age: item.age,
      gender: item.gender,
      color: item.color,
      weight: item.weight,
      milkCapacity: item.milkCapacity,
      healthStatus: item.healthStatus,
      vaccinationStatus: item.vaccinationStatus,
      pregnancyStatus: item.pregnancyStatus,
      description: item.description,
      price: item.price,
      negotiable: item.negotiable,
      photos: item.photos,
      videoURL: item.videoURL,
      state: item.state,
      district: item.district,
      village: item.village,
      locationDescription: item.locationDescription,
      contactNumber: item.contactNumber,
      whatsappEnabled: item.whatsappEnabled,
      status: 'ACTIVE',
      featured: false,
      views: 0,
      publishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}
