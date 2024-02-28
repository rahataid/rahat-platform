import { RumsanClientClass } from '@rumsan/sdk/rumsan.client';
import { Beneficiary } from './services';

class RahatClientClass extends RumsanClientClass {
  public Beneficiary = Beneficiary;
}

export const RahatClient = new RahatClientClass();
