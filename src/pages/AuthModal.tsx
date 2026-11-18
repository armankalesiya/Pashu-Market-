import React, { useEffect, useRef, useState } from 'react';
import {
  ConfirmationResult,
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
} from 'firebase/auth';
import { Camera, CheckCircle2, Phone, ShieldAlert } from 'lucide-react';
import { auth } from '../firebase/config';
import { useApp } from '../context/AppContext';
import {
  checkIsAdminUser,
  createUserProfile,
  formatReadableFirebaseError,
  getUserProfile,
  uploadImageSmart,
} from '../services/marketplaceService';
import { INDIAN_STATES_DISTRICTS } from '../utils/constants';
import { isValidPhoneInput, normalizeIndianPhone, validateMediaFile } from '../utils/validation';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input, Select } from '../components/ui/Input';

export function AuthModal() {
  const {
    authModalOpen,
    closeAuthModal,
    firebaseUser,
    needsRegistration,
    setNeedsRegistration,
    setUserProfile,
    lang,
    t,
    showToast,
  } = useApp();

  const [tab, setTab] = useState<'phone' | 'google'>('google');
  const [phoneInput, setPhoneInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [phoneConfigNote, setPhoneConfigNote] = useState(false);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regState, setRegState] = useState('Gujarat');
  const [regDistrict, setRegDistrict] = useState('Bhavnagar');
  const [regVillage, setRegVillage] = useState('');
  const [regPhotoURL, setRegPhotoURL] = useState('');
  const [regPhotoUploading, setRegPhotoUploading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [regError, setRegError] = useState('');

  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const id = setTimeout(() => setResendSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSeconds]);

  useEffect(() => {
    if (firebaseUser) {
      setRegName((prev) => prev || firebaseUser.displayName || '');
      setRegEmail((prev) => prev || firebaseUser.email || '');
      setRegPhone((prev) => prev || firebaseUser.phoneNumber || '');
      setRegPhotoURL((prev) => prev || firebaseUser.photoURL || '');
    }
  }, [firebaseUser]);

  const setupRecaptcha = () => {
    if (recaptchaRef.current) return recaptchaRef.current;
    const verifier = new RecaptchaVerifier(auth, 'pm-recaptcha-container', {
      size: 'invisible',
    });
    recaptchaRef.current = verifier;
    return verifier;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setPhoneConfigNote(false);
    if (!isValidPhoneInput(phoneInput)) {
      setAuthError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    const formatted = normalizeIndianPhone(phoneInput);
    setLoading(true);
    try {
      const verifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, formatted, verifier);
      setConfirmationResult(result);
      setResendSeconds(60);
      showToast(`OTP sent to ${formatted}`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (
        msg.includes('operation-not-allowed') ||
        msg.includes('billing-not-enabled') ||
        msg.includes('captcha') ||
        msg.includes('app-not-authorized')
      ) {
        setPhoneConfigNote(true);
        setAuthError(
          'Firebase Phone Authentication is not enabled or billing/authorized domain is not configured on this Firebase project yet. Enable Phone Sign-In in Firebase Console -> Authentication -> Sign-in method, or use Google Sign-In below.'
        );
      } else {
        setAuthError(msg);
      }
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    if (otpInput.trim().length < 6) {
      setAuthError('Enter the 6-digit OTP code.');
      return;
    }
    setLoading(true);
    setAuthError('');
    try {
      const cred = await confirmationResult.confirm(otpInput.trim());
      const existing = await getUserProfile(cred.user.uid);
      if (existing) {
        setUserProfile(existing);
        setNeedsRegistration(false);
        closeAuthModal();
        showToast('Signed in successfully!', 'success');
      } else {
        setNeedsRegistration(true);
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setAuthError('');
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await checkIsAdminUser(cred.user.uid, cred.user.email, cred.user.emailVerified);
      const existing = await getUserProfile(cred.user.uid);
      if (existing) {
        setUserProfile(existing);
        setNeedsRegistration(false);
        closeAuthModal();
        showToast('Signed in successfully!', 'success');
      } else {
        setNeedsRegistration(true);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google Sign-In failed.';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;
    const err = validateMediaFile(file, 'image');
    if (err) {
      setRegError(err);
      return;
    }
    setRegPhotoUploading(true);
    setRegError('');
    try {
      const url = await uploadImageSmart(
        file,
        `profiles/${firebaseUser.uid}/avatar_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`,
        undefined,
        110000
      );
      setRegPhotoURL(url);
    } catch (uploadErr) {
      setRegError(
        uploadErr instanceof Error
          ? `Photo upload failed (${uploadErr.message}). You can still continue without a photo.`
          : 'Photo upload failed.'
      );
    } finally {
      setRegPhotoUploading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setRegError('');
    if (regName.trim().length < 2) {
      setRegError('Please enter your full name.');
      return;
    }
    if (regPhone && !isValidPhoneInput(regPhone)) {
      setRegError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (!regState || !regDistrict) {
      setRegError('Please select your State and District.');
      return;
    }
    if (!termsAccepted) {
      setRegError('Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      const profile = await createUserProfile({
        uid: firebaseUser.uid,
        name: regName.trim(),
        phone: regPhone ? normalizeIndianPhone(regPhone) : '',
        email: regEmail.trim() || firebaseUser.email || '',
        state: regState,
        district: regDistrict,
        village: regVillage.trim(),
        photoURL: regPhotoURL,
        language: lang,
      });
      setUserProfile(profile);
      setNeedsRegistration(false);
      closeAuthModal();
      showToast('Profile registered! Welcome to Pashu Market.', 'success');
    } catch (err) {
      setRegError(formatReadableFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const districts = INDIAN_STATES_DISTRICTS[regState] || [];

  return (
    <Modal
      open={authModalOpen}
      onClose={closeAuthModal}
      title={needsRegistration ? t.auth.completeProfileTitle : t.auth.welcomeTitle}
      subtitle={needsRegistration ? t.auth.completeProfileSubtitle : t.auth.welcomeSubtitle}
      maxWidthClass="max-w-lg"
    >
      <div id="pm-recaptcha-container" />

      {needsRegistration && firebaseUser ? (
        <form onSubmit={handleCompleteRegistration} className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F0EB] border border-[#E4E7E1] overflow-hidden flex items-center justify-center shrink-0">
              {regPhotoURL ? (
                <img
                  src={regPhotoURL}
                  alt="Profile preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-[#173F35]" />
              )}
            </div>
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] border border-[#E4E7E1] text-xs font-semibold text-[#173F35] hover:bg-[#E8F0EB]">
                {regPhotoUploading ? 'Uploading...' : t.auth.profilePhoto}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="sr-only"
              />
            </label>
          </div>

          <Input
            label={`${t.auth.fullName} *`}
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
            placeholder="e.g. Rameshbhai Patel"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t.auth.mobileLabel}
              value={regPhone}
              onChange={(e) => setRegPhone(e.target.value)}
              placeholder="+91 98765 43210"
            />
            <Input
              label={t.auth.emailOptional}
              type="email"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              placeholder="name@example.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label={`${t.auth.stateLabel} *`}
              value={regState}
              onChange={(e) => {
                const nextState = e.target.value;
                setRegState(nextState);
                setRegDistrict((INDIAN_STATES_DISTRICTS[nextState] || [])[0] || '');
              }}
            >
              {Object.keys(INDIAN_STATES_DISTRICTS).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>

            <Select
              label={`${t.auth.districtLabel} *`}
              value={regDistrict}
              onChange={(e) => setRegDistrict(e.target.value)}
            >
              {districts.map((dist) => (
                <option key={dist} value={dist}>
                  {dist}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label={t.auth.villageLabel}
            value={regVillage}
            onChange={(e) => setRegVillage(e.target.value)}
            placeholder="e.g. Sihor"
          />

          <label className="flex items-start gap-2.5 text-xs text-[#26332E] cursor-pointer">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#E4E7E1] accent-[#173F35]"
            />
            <span>{t.auth.termsAgree}</span>
          </label>

          {regError && (
            <p className="text-xs font-medium text-[#C94D4D] bg-[#C94D4D]/10 px-3 py-2 rounded-[10px]">
              {regError}
            </p>
          )}

          <Button type="submit" fullWidth loading={loading}>
            <CheckCircle2 className="w-4 h-4" />
            <span>{t.auth.createAccount}</span>
          </Button>
        </form>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-[12px] bg-[#F7F5EF] border border-[#E4E7E1]">
            <button
              type="button"
              onClick={() => {
                setTab('google');
                setAuthError('');
              }}
              className={`min-h-[40px] rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'google'
                  ? 'bg-[#173F35] text-white'
                  : 'text-[#78847D] hover:text-[#26332E]'
              }`}
            >
              {t.auth.googleTab}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('phone');
                setAuthError('');
              }}
              className={`min-h-[40px] rounded-[10px] text-xs font-semibold transition-colors cursor-pointer ${
                tab === 'phone'
                  ? 'bg-[#173F35] text-white'
                  : 'text-[#78847D] hover:text-[#26332E]'
              }`}
            >
              {t.auth.phoneTab}
            </button>
          </div>

          {tab === 'google' ? (
            <div className="space-y-4">
              <p className="text-sm text-[#78847D] leading-relaxed">
                Sign in securely with your Google account to publish listings, message sellers, and manage your farm profile.
              </p>
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                loading={loading}
                onClick={handleGoogleSignIn}
              >
                <span>{t.auth.googleContinue}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {!confirmationResult ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <Input
                    label={t.auth.mobileLabel}
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder={t.auth.mobilePlaceholder}
                    hint="Format: 10-digit Indian mobile (e.g. 9876543210)"
                  />
                  <Button type="submit" fullWidth loading={loading}>
                    <Phone className="w-4 h-4" />
                    <span>{t.auth.sendOtp}</span>
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <Input
                    label={t.auth.otpLabel}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    placeholder="6-digit OTP"
                  />
                  <Button type="submit" fullWidth loading={loading}>
                    {t.auth.verifyOtp}
                  </Button>
                  <div className="flex items-center justify-between text-xs text-[#78847D]">
                    <button
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="text-[#173F35] font-medium hover:underline cursor-pointer"
                    >
                      Change number
                    </button>
                    {resendSeconds > 0 ? (
                      <span className="tabular-nums">
                        {t.auth.resendOtpIn} {resendSeconds}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#173F35] font-semibold hover:underline cursor-pointer"
                      >
                        {t.auth.resendOtp}
                      </button>
                    )}
                  </div>
                </form>
              )}

              {phoneConfigNote && (
                <div className="p-3.5 rounded-[12px] bg-[#E8F0EB] border border-[#245747]/20 text-xs text-[#26332E] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#173F35]">
                    <ShieldAlert className="w-4 h-4" />
                    <span>Firebase Phone Auth Setup Required</span>
                  </div>
                  <p>
                    1. Open Firebase Console → Authentication → Sign-in method → Enable <strong>Phone</strong>.<br />
                    2. Add your deployment domain under Authorized Domains.<br />
                    3. Or switch to the <strong>Google Sign-In</strong> tab above for instant access.
                  </p>
                </div>
              )}
            </div>
          )}

          {authError && !phoneConfigNote && (
            <p className="text-xs font-medium text-[#C94D4D] bg-[#C94D4D]/10 px-3 py-2 rounded-[10px]">
              {authError}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
