import { RazorpayOptions, RazorpayOrderData, RazorpayOrderResponse } from '../types/razorpay';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

export const loadScript = (src: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializeRazorpay = async (options: RazorpayOptions): Promise<{ open: () => void; close: () => void }> => {
  const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

  if (!res) {
    throw new Error('Razorpay SDK failed to load');
  }

  const razorpay = new window.Razorpay(options);
  return razorpay;
};

export const createRazorpayOrder = async (orderData: RazorpayOrderData): Promise<RazorpayOrderResponse> => {
  try {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};