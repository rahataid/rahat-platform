export type SettingResponse = {
  name: string;
  value: any;
  dataType: string;
  requiredFields: string[];
  isReadOnly: boolean;
  isPrivate: boolean;
};

export type SettingInput = {
  name: string;
  value: any;
  requiredFields: string[];
  isReadOnly: boolean | null;
  isPrivate: boolean | null;
};

export type SettingList = {
  sucess: boolean;
  data: any;
};
