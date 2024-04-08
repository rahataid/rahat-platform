import { Injectable } from '@nestjs/common';
import { CreateSettingDto } from '@rumsan/extensions/dtos';
import { PrismaService } from '@rumsan/prisma';
import { SettingDataType } from '@rumsan/sdk/enums';



function getDataType(
  value: string | number | boolean | object,
): SettingDataType {
  if (typeof value === 'string') {
    return SettingDataType.STRING;
  } else if (typeof value === 'number') {
    return SettingDataType.NUMBER;
  } else if (typeof value === 'boolean') {
    return SettingDataType.BOOLEAN;
  } else if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return SettingDataType.OBJECT;
  }
  throw new Error(`Invalid data type for 'value': ${typeof value}`);
}


@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService
  ) { }
  async createRahatAppSettings(
    createSettingDto: CreateSettingDto,
  ) {
    let {
      name,
      value: dtoValue,
      requiredFields,
      isReadOnly,
      isPrivate,
    } = createSettingDto;
    let value: any = dtoValue;

    const requiredFieldsArray: string[] = requiredFields
      ? requiredFields.map((field) => field)
      : [];

    const dataType = getDataType(value);

    // Check if 'value' is an object and not an array or null
    if (dataType === SettingDataType.OBJECT) {
      // Use type assertion here to tell TypeScript that value is an object
      const rawValueObject = value as Record<string, any>;
      // No capitalization of keys of the 'value' object

      // Check if 'value' object has all the properties specified in 'requiredFields' (case-insensitive)
      if (requiredFieldsArray && requiredFieldsArray.length > 0) {
        value = Object.keys(value)
          .filter((key) => requiredFieldsArray.includes(key))
          .reduce((obj: any, key) => {
            obj[key] = value[key];
            return obj;
          }, {});

        const missingFields = requiredFieldsArray.filter((field) => {
          const matchingKey = Object.keys(value).find(
            (key) => key === field,
          );
          return !matchingKey;
        });

        if (missingFields.length > 0) {
          throw new Error(
            `Required fields missing in 'value' object: ${missingFields.join(
              ', ',
            )}`,
          ); // 400 Bad Request
        }
      }
    } else {
      // If 'value' is not an object, set 'requiredFields' to an empty array []
      requiredFields = [];
    }


    console.log('first', {
      name,
      value,
      dataType,
      requiredFields: requiredFieldsArray,
      isReadOnly,
      isPrivate,
    })
    const existingSetting = await this.prisma.setting.findUnique({
      where: { name },
    });

    if (existingSetting) {
      throw new Error('Setting with this name already exists'); // 400 Bad Request
    }
    const newSetting = await this.prisma.setting.create({
      data: {
        name,
        value,
        dataType,
        requiredFields: requiredFieldsArray,
        isReadOnly,
        isPrivate,
      },
    });

    return newSetting;
  }
}
