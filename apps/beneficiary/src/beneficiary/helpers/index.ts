// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
export const createListQuery = (dto: any) => {
  const AND_CONDITIONS = [];

  const queryKeys = Object.keys(dto);
  const queryValues = Object.values(dto);

  for (let i = 0; i < queryKeys.length; i++) {
    if (queryKeys[i] === 'gender') {
      AND_CONDITIONS.push({
        gender: queryValues[i],
      });
    }
    if (queryKeys[i] === 'type') {
      AND_CONDITIONS.push({
        type: queryValues[i],
      });
    }
  }

  return AND_CONDITIONS;
};

export const splitBeneficiaryPII = (beneficiary: any) => {
  const { firstName, lastName, phone, email, govtIDNumber, archived, deletedAt, ...rest } = beneficiary;
  const piiData = {
    name: `${beneficiary.firstName} ${beneficiary.lastName}`,
    phone: phone || '',
    email: email || '',
    extras: {
      govtIDNumber: govtIDNumber || ''
    }
  }
  const sanitized = sanitizeBeneficiaryPayload(rest);
  return { piiData, nonPii: sanitized }
}

const sanitizeBeneficiaryPayload = (beneficiary: any) => {
  if (beneficiary.id) delete beneficiary.id;
  if (beneficiary.uuid) delete beneficiary.uuid;
  if (beneficiary.targetUUID) delete beneficiary.targetUUID;
  if (beneficiary.groupName) delete beneficiary.groupName;
  if (beneficiary.createdAt) delete beneficiary.createdAt;
  if (beneficiary.updatedAt) delete beneficiary.updatedAt;

  return beneficiary;
}

export function toPascalCase(input: string): string {
  return input
    .replace(/^channel/, '')
    .replace(/_+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

export const FIELD_MAP = {
  NO_OF_LACTATING_WOMEN: 'no_of_lactating_women',
  NO_OF_PERSONS_WITH_DISABILITY: 'no_of_persons_with_disability',
  NO_OF_PREGNANT_WOMEN: 'no_of_pregnant_women',
};


export const AGE_GROUPS = {
  BELOW_20: '<20',
  AGE_19_TO_29: '20-29',
  AGE_30_TO_45: '30-45',
  AGE_46_TO_59: '46-59',
  ABOVE_60: '>60',
};

export const TYPE_OF_SSA = {
  SENIOR_CITIZEN_ABOVE_70: 'senior_citizen__70',
  SENIOR_CITIZEN_DALIT_ABOVE_60: 'senior_citizen__60__dalit',
  CHILD_NUTRITION: 'child_nutrition',
  SINGLE_WOMEN: 'single_woman',
  WIDOW: 'widow',
  RED_CARD: 'red_class',
  BLUE_CARD: 'blue_card',
  INDIGENOUS_COMMUNITY: 'indigenous_community',
};
export const FIELD_COMMUNICATION_CHANNEL = [
  'channelcommunity',
  'channelfm_radio',
  'channelmobile_phone___sms',
  'channelnewspaper',
  'channelothers',
  'channelpeople_representatives',
  'channelrelatives',
  'channelsocial_media',

]



export function countResult(data: any[]) {
  const counts: Record<string, number> = {
    [FIELD_MAP.NO_OF_LACTATING_WOMEN]: 0,
    [FIELD_MAP.NO_OF_PERSONS_WITH_DISABILITY]: 0,
    [FIELD_MAP.NO_OF_PREGNANT_WOMEN]: 0,
  };

  for (const item of data) {
    const extras = item.extras || {};
    for (const field of Object.values(FIELD_MAP)) {
      const rawVal = extras[field];
      if (rawVal === '' || rawVal === '-' || rawVal == null) {
        continue;
      }
      const val = parseInt(rawVal);
      if (!isNaN(val) && val > 0) {
        counts[field] += val;
      }
    }
  }
  return counts;
}

export function getAgeGroup(age: number): string {
  if (age < 20) return AGE_GROUPS.BELOW_20;
  if (age >= 20 && age <= 29) return AGE_GROUPS.AGE_19_TO_29;
  if (age >= 30 && age <= 45) return AGE_GROUPS.AGE_30_TO_45;
  if (age >= 46 && age <= 59) return AGE_GROUPS.AGE_46_TO_59;
  return AGE_GROUPS.ABOVE_60;
}
export function mapAgeGroupCounts(data: any[]): Record<string, number> {
  const counts: Record<string, number> = {
    [AGE_GROUPS.BELOW_20]: 0,
    [AGE_GROUPS.AGE_19_TO_29]: 0,
    [AGE_GROUPS.AGE_30_TO_45]: 0,
    [AGE_GROUPS.AGE_46_TO_59]: 0,
    [AGE_GROUPS.ABOVE_60]: 0,
  };

  for (const item of data) {
    const age = item?.extras?.interviewee_age;
    if (typeof age === 'number') {
      const group = getAgeGroup(age);
      counts[group]++;
    }
  }

  return counts;
}


export function countBySSAType(data: any[]) {
  const counts: Record<string, number> = {};

  // Initialize counts with zero
  Object.values(TYPE_OF_SSA).forEach((val) => {
    counts[val] = 0;
  });

  for (const item of data) {
    const ssaType = item?.extras?.type_of_ssa;

    // Skip if ssaType is '-' or falsy
    if (!ssaType || ssaType === '-') continue;

    if (Object.values(TYPE_OF_SSA).includes(ssaType)) {
      counts[ssaType] = (counts[ssaType] || 0) + 1;
    }
  }

  return counts;
}


