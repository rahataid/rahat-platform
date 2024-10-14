import { Injectable } from '@nestjs/common';
import { ProviderActionDto } from '@rahataid/extensions';

@Injectable()
export class KotaniPayService {
    createCustomerMobileMoneyWallet(data: ProviderActionDto) {
        return {
            success: true,
            message: "Customer has been successfully created.",
            data: {
                phone_number: "+254722154745",
                country_code: "KE",
                customer_key: "QozR5knCfvkdAezXT7rx",
                integrator: "66d93d7524321e43c9245c9a",
                account_name: "rumsan-tester",
                network: "AIRTEL"
            }
        };
    }

    createFiatWallet(data: ProviderActionDto) {
        return {
            success: false,
            message: "WALLET_ALREADY_EXIST",
            error_code: 409
        };
    }

    kotaniPayActions = {
        'create-customer-mobile-wallet': this.createCustomerMobileWallet,
        'create-fiat-wallet': this.createFiatWallet,
        // Add more Kotani Pay actions here
    };
}
