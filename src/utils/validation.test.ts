import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortListings,
  formatINR,
  isValidPhoneInput,
  normalizeIndianPhone,
  validateMediaFile,
  validateSellListingInput,
} from './validation';
import { STARTER_LISTINGS } from './constants';
import { ExploreFilters } from '../types';

const defaultFilters: ExploreFilters = {
  search: '',
  category: 'All',
  breed: '',
  state: '',
  district: '',
  minPrice: '',
  maxPrice: '',
  age: '',
  gender: 'All',
  sortBy: 'newest',
  nearbyOnly: false,
};

test('formatINR formats Indian currency cleanly', () => {
  assert.equal(formatINR(92000), '₹92,000');
  assert.equal(formatINR(135000), '₹1,35,000');
  assert.equal(formatINR(-10), '₹0');
});

test('normalizeIndianPhone & isValidPhoneInput handle 10-digit and +91 numbers', () => {
  assert.equal(normalizeIndianPhone('9876543210'), '+919876543210');
  assert.equal(normalizeIndianPhone('+91 98765 43210'), '+919876543210');
  assert.equal(isValidPhoneInput('9876543210'), true);
  assert.equal(isValidPhoneInput('12345'), false);
});

test('validateMediaFile enforces image and video limits', () => {
  assert.equal(validateMediaFile({ type: 'image/jpeg', size: 1024 * 1024 }, 'image'), null);
  assert.notEqual(validateMediaFile({ type: 'application/pdf', size: 1000 }, 'image'), null);
  assert.notEqual(validateMediaFile({ type: 'image/png', size: 6 * 1024 * 1024 }, 'image'), null);
  assert.equal(validateMediaFile({ type: 'video/mp4', size: 10 * 1024 * 1024 }, 'video'), null);
  assert.notEqual(validateMediaFile({ type: 'video/mp4', size: 30 * 1024 * 1024 }, 'video'), null);
});

test('validateSellListingInput rejects incomplete submissions and accepts valid listings', () => {
  const invalidErrors = validateSellListingInput({
    category: '',
    breed: 'A',
    age: '',
    gender: '',
    color: '',
    healthStatus: '',
    vaccinationStatus: '',
    description: 'short',
    price: 0,
    photosCount: 0,
    state: '',
    district: '',
    village: '',
    sellerName: 'R',
    contactNumber: '123',
  });
  assert.ok(Object.keys(invalidErrors).length >= 10);

  const validErrors = validateSellListingInput({
    category: 'Cow',
    breed: 'Gir',
    age: '4 Years',
    gender: 'Female',
    color: 'Reddish Brown',
    healthStatus: 'Healthy',
    vaccinationStatus: 'FMD Vaccinated',
    description: 'Purebred healthy Gir cow giving 15L milk daily.',
    price: 85000,
    photosCount: 2,
    state: 'Gujarat',
    district: 'Bhavnagar',
    village: 'Sihor',
    sellerName: 'Rameshbhai Patel',
    contactNumber: '9825011223',
  });
  assert.deepEqual(validErrors, {});
});

test('filterAndSortListings filters by category, price, search, and sorts accurately', () => {
  const cows = filterAndSortListings(STARTER_LISTINGS, {
    ...defaultFilters,
    category: 'Cow',
  });
  assert.equal(cows.length, 1);
  assert.equal(cows[0].breed, 'Gir');

  const sortedAsc = filterAndSortListings(STARTER_LISTINGS, {
    ...defaultFilters,
    sortBy: 'price_asc',
  });
  assert.ok(sortedAsc[0].price <= sortedAsc[1].price);

  const sortedDesc = filterAndSortListings(STARTER_LISTINGS, {
    ...defaultFilters,
    sortBy: 'price_desc',
  });
  assert.ok(sortedDesc[0].price >= sortedDesc[1].price);

  const searchMatch = filterAndSortListings(STARTER_LISTINGS, {
    ...defaultFilters,
    search: 'Hisar',
  });
  assert.equal(searchMatch.length, 1);
  assert.equal(searchMatch[0].breed, 'Murrah');
});
