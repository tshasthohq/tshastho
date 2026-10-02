import { PaymentGateway } from './types';
import { sslcommerzGateway } from './gateways/sslcommerz';

export function getGateway(name: string): PaymentGateway {
  switch (name.toUpperCase()) {
    case 'SSLCOMMERZ':
      return sslcommerzGateway;
    default:
      throw new Error(`Unknown gateway: ${name}`);
  }
}

export * from './types';
export * from './utils';
