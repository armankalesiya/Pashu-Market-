import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Globe, ImagePlus, RefreshCw, Trash2, Upload, Video } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatReadableFirebaseError,
  generateFirestoreId,
  publishAnimalListing,
  updateOwnerListing,
  uploadImageSmart,
  uploadMediaFile,
} from '../services/marketplaceService';
import { AnimalCategory, AnimalGender, AnimalListing } from '../types';
import { BREEDS_BY_CATEGORY, INDIAN_STATES_DISTRICTS } from '../utils/constants';
import {
  formatINR,
  normalizeIndianPhone,
  validateMediaFile,
  validateSellListingInput,
} from '../utils/validation';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';

interface MediaItem {
  id: string;
  url: string;
  file?: File;
}

export function SellPage() {
  const {
    t,
    lang,
    firebaseUser,
    userProfile,
    openAuthModal,
    categories,
    editingListing,
    openListing,
    navigate,
    addOptimisticListing,
    showToast,
  } = useApp();

  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<AnimalCategory>(editingListing?.category || 'Cow');
  const [breed, setBreed] = useState(editingListing?.breed || '');
  const [age, setAge] = useState(editingListing?.age || '');
  const [gender, setGender] = useState<AnimalGender>(editingListing?.gender || 'Female');
  const [color, setColor] = useState(editingListing?.color || '');
  const [weight, setWeight] = useState(editingListing?.weight || '');
  const [milkCapacity, setMilkCapacity] = useState(editingListing?.milkCapacity || '');
  const [healthStatus, setHealthStatus] = useState(editingListing?.healthStatus || 'Healthy & Active');
  const [vaccinationStatus, setVaccinationStatus] = useState(
    editingListing?.vaccinationStatus || 'FMD Vaccinated'
  );
  const [pregnancyStatus, setPregnancyStatus] = useState(editingListing?.pregnancyStatus || '');

  const [photos, setPhotos] = useState<MediaItem[]>(
    () =>
      editingListing?.photos.map((url, idx) => ({ id: `existing_${idx}`, url })) || []
  );
  const [videoItem, setVideoItem] = useState<{ url: string; file?: File } | null>(
    editingListing?.videoURL ? { url: editingListing.videoURL } : null
  );
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [mediaError, setMediaError] = useState('');

  const [price, setPrice] = useState(editingListing ? String(editingListing.price) : '');
  const [negotiable, setNegotiable] = useState(editingListing ? editingListing.negotiable : true);

  const [stateName, setStateName] = useState(
    editingListing?.state || userProfile?.state || 'Gujarat'
  );
  const [district, setDistrict] = useState(
    editingListing?.district || userProfile?.district || 'Bhavnagar'
  );
  const [village, setVillage] = useState(editingListing?.village || userProfile?.village || '');
  const [locationDescription, setLocationDescription] = useState(
    editingListing?.locationDescription || ''
  );

  const [description, setDescription] = useState(editingListing?.description || '');
  const [sellerName, setSellerName] = useState(
    editingListing?.sellerName || userProfile?.name || ''
  );
  const [contactNumber, setContactNumber] = useState(
    editingListing?.contactNumber || userProfile?.phone || ''
  );
  const [whatsappEnabled, setWhatsappEnabled] = useState(
    editingListing ? editingListing.whatsappEnabled : true
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [publishError, setPublishError] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedListing, setPublishedListing] = useState<AnimalListing | null>(null);

  useEffect(() => {
    setStep(1);
    setErrors({});
    setPublishError('');
    setMediaError('');
    setPublishedListing(null);
    if (editingListing) {
      setCategory(editingListing.category);
      setBreed(editingListing.breed);
      setAge(editingListing.age);
      setGender(editingListing.gender);
      setColor(editingListing.color);
      setWeight(editingListing.weight || '');
      setMilkCapacity(editingListing.milkCapacity || '');
      setHealthStatus(editingListing.healthStatus);
      setVaccinationStatus(editingListing.vaccinationStatus);
      setPregnancyStatus(editingListing.pregnancyStatus || '');
      setPhotos(editingListing.photos.map((url, idx) => ({ id: `existing_${idx}`, url })));
      setVideoItem(editingListing.videoURL ? { url: editingListing.videoURL } : null);
      setPrice(String(editingListing.price));
      setNegotiable(editingListing.negotiable);
      setStateName(editingListing.state);
      setDistrict(editingListing.district);
      setVillage(editingListing.village);
      setLocationDescription(editingListing.locationDescription || '');
      setDescription(editingListing.description);
      setSellerName(editingListing.sellerName);
      setContactNumber(editingListing.contactNumber);
      setWhatsappEnabled(editingListing.whatsappEnabled);
    } else {
      setCategory('Cow');
      setBreed('');
      setAge('');
      setGender('Female');
      setColor('');
      setWeight('');
      setMilkCapacity('');
      setHealthStatus('Healthy & Active');
      setVaccinationStatus('FMD Vaccinated');
      setPregnancyStatus('');
      setPhotos([]);
      setVideoItem(null);
      setPrice('');
      setNegotiable(true);
      setStateName(userProfile?.state || 'Gujarat');
      setDistrict(userProfile?.district || 'Bhavnagar');
      setVillage(userProfile?.village || '');
      setLocationDescription('');
      setDescription('');
      setSellerName(userProfile?.name || '');
      setContactNumber(userProfile?.phone || '');
      setWhatsappEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingListing?.listingId]);

  useEffect(() => {
    if (firebaseUser && !editingListing) {
      setSellerName((prev) => prev || userProfile?.name || firebaseUser.displayName || '');
      setContactNumber((prev) => prev || userProfile?.phone || firebaseUser.phoneNumber || '');
      if (userProfile?.state) setStateName((prev) => prev || userProfile.state);
      if (userProfile?.district) setDistrict((prev) => prev || userProfile.district);
      if (userProfile?.village) setVillage((prev) => prev || userProfile.village);
    }
  }, [firebaseUser, userProfile, editingListing]);

  if (!firebaseUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <EmptyState
          icon={<Upload className="w-7 h-7" />}
          title={t.sell.signInRequiredTitle}
          description={t.sell.signInRequiredDesc}
          actionLabel={t.nav.signIn}
          onAction={openAuthModal}
        />
      </div>
    );
  }

  const resetWizardForNewAd = () => {
    setPublishedListing(null);
    setStep(1);
    setErrors({});
    setPublishError('');
    setMediaError('');
    setBreed('');
    setAge('');
    setColor('');
    setWeight('');
    setMilkCapacity('');
    setPregnancyStatus('');
    setPhotos([]);
    setVideoItem(null);
    setPrice('');
    setLocationDescription('');
    setDescription('');
  };

  if (publishedListing) {
    const publishedTitle = `${publishedListing.breed} ${publishedListing.category}`;
    return (
      <div className="max-w-2xl mx-auto py-6 space-y-6 pb-16">
        <div className="rounded-[16px] bg-white border-2 border-[#347A54]/40 p-6 sm:p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-full bg-[#E8F0EB] text-[#347A54] flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#347A54] text-white text-xs font-bold tracking-wide">
            <Globe className="w-3.5 h-3.5" />
            <span>{t.sell.livePublicBadge}</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
            {t.sell.publishedCardTitle}
          </h1>
          <p className="text-sm text-[#78847D] max-w-lg mx-auto leading-relaxed">
            {t.sell.publishedCardDesc}
          </p>
        </div>

        <div className="rounded-[16px] bg-white border border-[#E4E7E1] overflow-hidden flex flex-col sm:flex-row">
          {publishedListing.photos[0] && (
            <div className="sm:w-56 aspect-[4/3] sm:aspect-auto bg-[#E8F0EB] shrink-0">
              <img
                src={publishedListing.photos[0]}
                alt={publishedTitle}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-5 flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#347A54]">
                {t.sell.livePublicBadge} · {publishedListing.category}
              </span>
              <span className="text-xs text-[#78847D]">ID: {publishedListing.listingId}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#26332E]">{publishedTitle}</h2>
            <div className="font-display text-2xl font-bold text-[#173F35] tabular-nums">
              {formatINR(publishedListing.price)}
            </div>
            <p className="text-xs text-[#78847D]">
              {publishedListing.village}, {publishedListing.district}, {publishedListing.state}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button variant="primary" size="lg" onClick={() => openListing(publishedListing.listingId)}>
            {t.sell.viewLiveAd}
          </Button>
          <Button variant="gold" size="lg" onClick={() => navigate('home')}>
            {t.sell.seeOnHome}
          </Button>
          <Button variant="outline" onClick={() => navigate('my-listings')}>
            {t.sell.goToMyListings}
          </Button>
          <Button variant="secondary" onClick={resetWizardForNewAd}>
            {t.sell.postAnother}
          </Button>
        </div>
      </div>
    );
  }

  const handlePhotoFiles = (files: FileList | null, replaceIndex?: number) => {
    if (!files || files.length === 0) return;
    setMediaError('');
    const list = Array.from(files);

    if (replaceIndex !== undefined) {
      const file = list[0];
      const err = validateMediaFile(file, 'image');
      if (err) {
        setMediaError(err);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      setPhotos((prev) =>
        prev.map((item, idx) => (idx === replaceIndex ? { id: `new_${Date.now()}`, url: previewUrl, file } : item))
      );
      return;
    }

    if (photos.length + list.length > 10) {
      setMediaError('You can upload a maximum of 10 photos.');
      return;
    }

    const nextItems: MediaItem[] = [];
    for (const file of list) {
      const err = validateMediaFile(file, 'image');
      if (err) {
        setMediaError(err);
        return;
      }
      nextItems.push({
        id: `new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        url: URL.createObjectURL(file),
        file,
      });
    }
    setPhotos((prev) => [...prev, ...nextItems]);
  };

  const handleVideoFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setMediaError('');
    const file = files[0];
    const err = validateMediaFile(file, 'video');
    if (err) {
      setMediaError(err);
      return;
    }
    setVideoItem({ url: URL.createObjectURL(file), file });
  };

  const validateStep = (targetStep: number): boolean => {
    const nextErrors: Record<string, string> = {};
    if (targetStep === 2) {
      if (breed.trim().length < 2) nextErrors.breed = 'Enter breed name (min 2 chars).';
      if (!age.trim()) nextErrors.age = 'Age is required.';
      if (!color.trim()) nextErrors.color = 'Color is required.';
      if (!healthStatus.trim()) nextErrors.healthStatus = 'Health status is required.';
      if (!vaccinationStatus.trim()) nextErrors.vaccinationStatus = 'Vaccination info is required.';
    } else if (targetStep === 3) {
      if (photos.length < 1) nextErrors.photos = 'Upload at least 1 photo.';
    } else if (targetStep === 4) {
      const p = Number(price);
      if (!Number.isFinite(p) || p <= 0) nextErrors.price = 'Enter a valid price in INR.';
    } else if (targetStep === 5) {
      if (!stateName) nextErrors.state = 'State is required.';
      if (!district) nextErrors.district = 'District is required.';
      if (!village.trim()) nextErrors.village = 'Village or city is required.';
    } else if (targetStep === 6) {
      if (description.trim().length < 10) {
        nextErrors.description = 'Description must be at least 10 characters.';
      }
      if (sellerName.trim().length < 2) nextErrors.sellerName = 'Seller name is required.';
      if (!contactNumber.trim()) nextErrors.contactNumber = 'Contact number is required.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handlePublish = async () => {
    setPublishError('');
    const validationErrors = validateSellListingInput({
      category,
      breed,
      age,
      gender,
      color,
      healthStatus,
      vaccinationStatus,
      description,
      price,
      photosCount: photos.length,
      state: stateName,
      district,
      village,
      sellerName,
      contactNumber,
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstErrMsg = Object.values(validationErrors)[0];
      setPublishError(firstErrMsg);
      if (validationErrors.breed || validationErrors.age || validationErrors.color || validationErrors.healthStatus || validationErrors.vaccinationStatus) {
        setStep(2);
      } else if (validationErrors.photos) {
        setStep(3);
      } else if (validationErrors.price) {
        setStep(4);
      } else if (validationErrors.state || validationErrors.district || validationErrors.village) {
        setStep(5);
      } else if (validationErrors.description || validationErrors.sellerName || validationErrors.contactNumber) {
        setStep(6);
      }
      showToast(firstErrMsg || t.sell.validationAlert, 'error');
      return;
    }

    setPublishing(true);
    setUploadProgress(5);
    try {
      const targetListingId = editingListing?.listingId || generateFirestoreId('lst');
      const uploadedPhotoUrls: string[] = [];
      const newPhotoFilesCount = photos.filter((p) => p.file).length;
      const perPhotoBudgetChars = Math.min(180000, Math.floor(600000 / Math.max(1, newPhotoFilesCount)));
      const totalUploads = newPhotoFilesCount + (videoItem?.file ? 1 : 0);
      let completed = 0;

      for (let i = 0; i < photos.length; i += 1) {
        const item = photos[i];
        if (item.file) {
          const url = await uploadImageSmart(
            item.file,
            `listings/${firebaseUser.uid}/${targetListingId}/photo_${i}_${Date.now()}_${item.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
            (pct) => {
              if (totalUploads > 0) {
                setUploadProgress(Math.max(10, Math.round(((completed + pct / 100) / totalUploads) * 90)));
              }
            },
            perPhotoBudgetChars
          );
          completed += 1;
          uploadedPhotoUrls.push(url);
        } else {
          uploadedPhotoUrls.push(item.url);
        }
      }

      let finalVideoUrl = videoItem?.file ? '' : videoItem?.url || '';
      if (videoItem?.file) {
        try {
          finalVideoUrl = await uploadMediaFile(
            videoItem.file,
            `listings/${firebaseUser.uid}/${targetListingId}/video_${Date.now()}_${videoItem.file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
            (pct) => {
              if (totalUploads > 0) {
                setUploadProgress(Math.max(10, Math.round(((completed + pct / 100) / totalUploads) * 95)));
              }
            },
            10000
          );
        } catch {
          showToast('Video upload skipped (cloud storage unavailable); publishing listing with photos.', 'info');
          finalVideoUrl = '';
        }
      }

      setUploadProgress(96);

      const payload = {
        sellerName: sellerName.trim(),
        sellerPhoto: userProfile?.photoURL || firebaseUser.photoURL || '',
        category,
        breed: breed.trim(),
        age: age.trim(),
        gender,
        color: color.trim(),
        weight: weight.trim(),
        milkCapacity: milkCapacity.trim(),
        healthStatus: healthStatus.trim(),
        vaccinationStatus: vaccinationStatus.trim(),
        pregnancyStatus: pregnancyStatus.trim(),
        description: description.trim(),
        price: Number(price),
        negotiable,
        photos: uploadedPhotoUrls,
        videoURL: finalVideoUrl,
        state: stateName,
        district,
        village: village.trim(),
        locationDescription: locationDescription.trim(),
        contactNumber: normalizeIndianPhone(contactNumber),
        whatsappEnabled,
      };

      if (editingListing) {
        await updateOwnerListing(editingListing.listingId, payload);
        showToast('Listing updated successfully!', 'success');
        openListing(editingListing.listingId);
      } else {
        const created = await publishAnimalListing(payload, targetListingId);
        addOptimisticListing(created);
        setPublishedListing(created);
        showToast(t.sell.publishSuccess, 'success');
      }
    } catch (err) {
      const readable = formatReadableFirebaseError(err);
      setPublishError(readable);
      showToast(readable, 'error');
    } finally {
      setPublishing(false);
      setUploadProgress(null);
    }
  };

  const breedList = BREEDS_BY_CATEGORY[category] || [];
  const districts = INDIAN_STATES_DISTRICTS[stateName] || [];
  const isDairyCategory = category === 'Cow' || category === 'Buffalo' || category === 'Goat';

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#26332E]">
          {editingListing ? 'Edit Animal Listing' : t.sell.title}
        </h1>
        <p className="text-sm text-[#78847D] mt-1">{t.sell.subtitle}</p>
      </div>

      {/* Stepper */}
      <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-[#173F35] mb-3">
          <span>
            {t.sell.stepLabel} {step} {t.sell.ofLabel} 7 — {t.sell.steps[step - 1]}
          </span>
          <span className="tabular-nums">{Math.round((step / 7) * 100)}%</span>
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {t.sell.steps.map((label, idx) => {
            const num = idx + 1;
            const active = num === step;
            const done = num < step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (num < step) setStep(num);
                }}
                aria-label={`Step ${num}: ${label}`}
                className={`h-2 rounded-full transition-colors ${
                  active ? 'bg-[#173F35]' : done ? 'bg-[#D6B875]' : 'bg-[#E4E7E1]'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Step Body */}
      <div className="rounded-[16px] bg-white border border-[#E4E7E1] p-6 space-y-5">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              1. {t.sell.steps[0]}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {categories.map((cat) => {
                const selected = category === cat.nameEn;
                return (
                  <button
                    key={cat.categoryId}
                    type="button"
                    onClick={() => setCategory(cat.nameEn)}
                    className={`rounded-[16px] p-3 border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-[#173F35] bg-[#E8F0EB] ring-2 ring-[#173F35]/20'
                        : 'border-[#E4E7E1] bg-white hover:border-[#245747]'
                    }`}
                  >
                    <div className="aspect-[16/10] rounded-[10px] overflow-hidden bg-[#F7F5EF] mb-2">
                      <img
                        src={cat.imageUrl}
                        alt={cat.nameEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-semibold text-[#26332E]">
                        {lang === 'hi' ? cat.nameHi : cat.nameEn}
                      </span>
                      {selected && <Check className="w-4 h-4 text-[#173F35]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              2. {t.sell.steps[1]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label={`${t.detail.breed} *`}
                  list="pm-breed-options"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder={`e.g. ${breedList[0] || 'Gir'}`}
                  error={errors.breed}
                />
                <datalist id="pm-breed-options">
                  {breedList.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <Input
                label={`${t.detail.age} *`}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 4 Years"
                error={errors.age}
              />

              <Select
                label={`${t.detail.gender} *`}
                value={gender}
                onChange={(e) => setGender(e.target.value as AnimalGender)}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Pair / Group">Pair / Group</option>
              </Select>

              <Input
                label={`${t.detail.color} *`}
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Jet Black / Reddish Brown"
                error={errors.color}
              />

              <Input
                label={t.detail.weight}
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 450 kg"
              />

              {isDairyCategory && (
                <Input
                  label={t.detail.milkCapacity}
                  value={milkCapacity}
                  onChange={(e) => setMilkCapacity(e.target.value)}
                  placeholder="e.g. 16 Litres / Day"
                />
              )}

              <Input
                label={`${t.detail.healthStatus} *`}
                value={healthStatus}
                onChange={(e) => setHealthStatus(e.target.value)}
                error={errors.healthStatus}
              />

              <Input
                label={`${t.detail.vaccinationStatus} *`}
                value={vaccinationStatus}
                onChange={(e) => setVaccinationStatus(e.target.value)}
                error={errors.vaccinationStatus}
              />

              {gender === 'Female' && (
                <Input
                  label={t.detail.pregnancyStatus}
                  value={pregnancyStatus}
                  onChange={(e) => setPregnancyStatus(e.target.value)}
                  placeholder="e.g. 2nd Lactation / Pregnant 4 months"
                />
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="font-display text-lg font-bold text-[#26332E]">
                3. {t.sell.steps[2]}
              </h2>
              <p className="text-xs text-[#78847D] mt-1">{t.sell.uploadPhotoHint}</p>
            </div>

            <label className="flex flex-col items-center justify-center rounded-[16px] border-2 border-dashed border-[#E4E7E1] bg-[#F7F5EF] p-6 text-center hover:border-[#173F35] transition-colors cursor-pointer">
              <ImagePlus className="w-7 h-7 text-[#173F35] mb-2" />
              <span className="text-sm font-semibold text-[#26332E]">{t.sell.uploadPhotos}</span>
              <span className="text-xs text-[#78847D] mt-1">{photos.length} / 10 selected</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handlePhotoFiles(e.target.files)}
                className="sr-only"
              />
            </label>

            {errors.photos && <p className="text-xs font-medium text-[#C94D4D]">{errors.photos}</p>}
            {mediaError && <p className="text-xs font-medium text-[#C94D4D]">{mediaError}</p>}

            {photos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="rounded-[12px] border border-[#E4E7E1] overflow-hidden bg-white"
                  >
                    <div className="aspect-[4/3] bg-[#E8F0EB]">
                      <img
                        src={photo.url}
                        alt={`Upload preview ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 bg-[#F7F5EF]">
                      <label className="inline-flex items-center gap-1 text-xs font-medium text-[#173F35] cursor-pointer">
                        <RefreshCw className="w-3 h-3" />
                        <span>{t.sell.replace}</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={(e) => handlePhotoFiles(e.target.files, idx)}
                          className="sr-only"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#C94D4D] cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.sell.remove}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-[#E4E7E1] space-y-2">
              <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[12px] border border-[#E4E7E1] text-xs font-semibold text-[#26332E] hover:border-[#173F35] cursor-pointer">
                <Video className="w-4 h-4 text-[#173F35]" />
                <span>{t.sell.uploadVideo}</span>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => handleVideoFile(e.target.files)}
                  className="sr-only"
                />
              </label>
              {videoItem && (
                <div className="flex items-center justify-between rounded-[12px] bg-[#F7F5EF] p-3">
                  <span className="text-xs font-medium text-[#26332E]">Video attached</span>
                  <button
                    type="button"
                    onClick={() => setVideoItem(null)}
                    className="text-xs font-semibold text-[#C94D4D] cursor-pointer"
                  >
                    {t.sell.remove}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              4. {t.sell.steps[3]}
            </h2>
            <Input
              label="Selling Price (INR ₹) *"
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 85000"
              error={errors.price}
            />
            <label className="flex items-center gap-2.5 text-sm text-[#26332E] cursor-pointer">
              <input
                type="checkbox"
                checked={negotiable}
                onChange={(e) => setNegotiable(e.target.checked)}
                className="h-4 w-4 rounded accent-[#173F35]"
              />
              <span>{t.sell.negotiableLabel}</span>
            </label>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              5. {t.sell.steps[4]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={`${t.explore.state} *`}
                value={stateName}
                onChange={(e) => {
                  const st = e.target.value;
                  setStateName(st);
                  setDistrict((INDIAN_STATES_DISTRICTS[st] || [])[0] || '');
                }}
                error={errors.state}
              >
                {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </Select>

              <Select
                label={`${t.explore.district} *`}
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                error={errors.district}
              >
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </div>

            <Input
              label="Village / Town / City *"
              value={village}
              onChange={(e) => setVillage(e.target.value)}
              placeholder="e.g. Sihor"
              error={errors.village}
            />

            <Input
              label="Landmark / Farm Location Notes"
              value={locationDescription}
              onChange={(e) => setLocationDescription(e.target.value)}
              placeholder="e.g. Near Dairy Co-op, 2 km from State Highway"
            />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              6. {t.sell.steps[5]}
            </h2>
            <Textarea
              label={`${t.detail.description} *`}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe temperament, feeding routine, lactation history, and farm visit availability..."
              error={errors.description}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Seller Name *"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                error={errors.sellerName}
              />
              <Input
                label="Contact Number *"
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="9876543210"
                error={errors.contactNumber}
              />
            </div>
            <label className="flex items-center gap-2.5 text-sm text-[#26332E] cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="h-4 w-4 rounded accent-[#173F35]"
              />
              <span>{t.sell.whatsappLabel}</span>
            </label>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-bold text-[#26332E]">
              7. {t.sell.steps[6]}
            </h2>

            <div className="rounded-[16px] border border-[#E4E7E1] overflow-hidden bg-[#F7F5EF]">
              {photos[0] && (
                <div className="aspect-[16/9] bg-[#E8F0EB]">
                  <img
                    src={photos[0].url}
                    alt="Listing preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-5 bg-white space-y-2">
                <div className="text-xs text-[#78847D]">
                  {category} · {age} · {gender} · {photos.length} photos
                </div>
                <h3 className="font-display text-xl font-bold text-[#26332E]">
                  {breed} {category}
                </h3>
                <div className="font-display text-2xl font-bold text-[#173F35] tabular-nums">
                  {formatINR(Number(price || 0))}{' '}
                  <span className="text-xs font-medium text-[#78847D]">
                    ({negotiable ? t.detail.negotiable : t.detail.fixedPrice})
                  </span>
                </div>
                <p className="text-xs text-[#78847D]">
                  {village}, {district}, {stateName}
                </p>
                <p className="text-sm text-[#26332E] pt-2">{description}</p>
              </div>
            </div>

            {publishError && (
              <div className="rounded-[12px] bg-[#C94D4D]/10 border border-[#C94D4D]/40 p-3.5 flex items-start gap-2.5 text-xs text-[#C94D4D] font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{publishError}</span>
              </div>
            )}

            {uploadProgress !== null && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-[#173F35]">
                  <span>Uploading media & publishing...</span>
                  <span className="tabular-nums">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#E8F0EB] overflow-hidden">
                  <div
                    className="h-full bg-[#173F35] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-[#E4E7E1] flex items-center justify-between gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={publishing}>
              {t.sell.back}
            </Button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <Button
              variant="primary"
              onClick={() => {
                if (validateStep(step)) setStep((s) => s + 1);
              }}
            >
              {t.sell.next}
            </Button>
          ) : (
            <Button variant="gold" loading={publishing} onClick={handlePublish}>
              {publishing ? t.sell.publishing : t.sell.publish}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
