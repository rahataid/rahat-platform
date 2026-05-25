// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
export const KOBO_FIELD_MAPPINGS = {
  name: 'name',
  villager_name: 'name',
  villagerName: 'name',
  Villager_Name: 'name',
  'Villager Name': 'name',
  'Name (姓名)': 'name',
  '姓名': 'name',
  phone_number: 'phone',
  mobile_number: 'phone',
  mobileNumber: 'phone',
  phone: 'phone',
  Villager_Phone_Number: 'phone',
  villager_phone_number: 'phone',
  'Villager Phone Number': 'phone',
  'Mobile Number (手机号码)': 'phone',
  '手机号码': 'phone',
  age: 'age',
  data: 'type',
  gender: 'gender',
  reason_for_lead: 'leadInterests',
  Beneficiary_Address: 'coordinates',
  occupation: 'occupation',
  province: 'province',
  district: 'district',
  commune: 'commune',
  village: 'village',
  village_doctor_name: 'healthWorkerName',
  villageDoctorName: 'healthWorkerName',
  Health_Worker_Name: 'healthWorkerName',
  'Village Doctor Name': 'healthWorkerName',
  kobo_username: 'koboUsername',
  vd: 'koboUsername', // New form: Village Doctor field (VD is the CHW in DB)
  Village_Doctor: 'koboUsername', // Kobo default column name for "Village Doctor" question
  village_doctor: 'koboUsername',
  'Village Doctor': 'koboUsername',
  // Eye_Partner / eye_partner intentionally unmapped: this field holds the vendor (eye partner) name
  // selected in KoboToolbox for UX purposes only — it is not related to Village Doctor resolution.
  data_collector_id: 'dataCollectorId',
  dataCollectorId: 'dataCollectorId',
  chw: 'dataCollectorId', // New form: Eye Partner field (data collector only)
  /** China: village doctor row UUID from Kobo dropdown (stored in payload meta) */
  village_doctor_uuid: 'villageDoctorUuid',
  chwUuid: 'villageDoctorUuid',
  vd_uuid: 'villageDoctorUuid',
};
