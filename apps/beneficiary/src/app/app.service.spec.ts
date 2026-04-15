// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Test } from '@nestjs/testing';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should return a string', () => {
      expect(service.create()).toBe('This action adds a new beneficiary');
    });
  });

  describe('findAll', () => {
    it('should return a string', () => {
      expect(service.findAll()).toBe('This action returns all beneficiary');
    });
  });

  describe('findOne', () => {
    it('should return a string with id', () => {
      expect(service.findOne(1)).toBe('This action returns a #1 beneficiary');
    });
  });

  describe('update', () => {
    it('should return a string with id', () => {
      expect(service.update(1)).toBe('This action updates a #1 beneficiary');
    });
  });

  describe('remove', () => {
    it('should return a string with id', () => {
      expect(service.remove(1)).toBe('This action removes a #1 beneficiary');
    });
  });
});
