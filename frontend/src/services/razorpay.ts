/**
 * Universal Official Razorpay Payment Service for Friends Turf
 * Strictly launches the official Razorpay Checkout popup iframe modal on the current page.
 * Uses official Razorpay handler callback (no custom intermediate modal, no callback_url redirect).
 */

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export interface RazorpayOrderData {
  order_id: string;
  amount: number; // in paise
  amount_in_rupees?: number;
  currency?: string;
  key_id: string;
  booking_id?: string;
  payment_id?: string;
  title?: string;
  description?: string;
}

export interface RazorpayUserPrefill {
  full_name?: string;
  first_name?: string;
  email?: string;
  phone?: string;
}

export interface RazorpayCheckoutParams {
  orderData: RazorpayOrderData;
  user?: RazorpayUserPrefill | null;
  onSuccess: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    booking_id?: string;
  }) => Promise<void> | void;
  onError?: (errorMessage: string) => void;
  onDismiss?: () => void;
  onStatusChange?: (status: string) => void;
}

/**
 * Loads the official Razorpay Checkout.js script into the document head/body.
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.getElementById("razorpay-checkout-js");
    if (existingScript) {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Initiates the official Razorpay Checkout standard in-page modal dialog.
 */
export const initiateRazorpayCheckout = async (
  params: RazorpayCheckoutParams
): Promise<void> => {
  const { orderData, user, onSuccess, onError, onDismiss, onStatusChange } = params;

  if (onStatusChange) {
    onStatusChange("Loading official Razorpay gateway...");
  }

  const isLoaded = await loadRazorpayScript();
  if (!isLoaded || typeof window.Razorpay === "undefined") {
    const errorMsg =
      "Unable to load Razorpay Payment Gateway. Please check your internet connection or disable ad-blockers.";
    if (onError) onError(errorMsg);
    return;
  }

  // Ensure amount is integer in paise
  const amountPaise = Math.round(Number(orderData.amount));

  // Persist order context in session/local storage for fail-safe redirect recovery
  try {
    const orderContext = {
      order_id: orderData.order_id,
      amount: amountPaise,
      booking_id: orderData.booking_id,
      payment_id: orderData.payment_id,
      title: orderData.title,
      description: orderData.description,
      key_id: orderData.key_id,
      saved_at: Date.now(),
    };
    sessionStorage.setItem("ft_active_razorpay_order", JSON.stringify(orderContext));
    localStorage.setItem("ft_active_razorpay_order", JSON.stringify(orderContext));
  } catch (_) {}

  try {
    let rzpInstance: any = null;

    // Derive the backend API base URL. In production (Cloudflare Pages), VITE_API_URL
    // is set to the Render backend origin (e.g. https://turf-bac.onrender.com).
    // In local dev, Vite proxies /api → localhost:8001, so we use window.location.origin.
    const apiBase = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
    const isAbsoluteBackend = apiBase.startsWith("http");
    const backendOrigin = isAbsoluteBackend ? apiBase : window.location.origin;
    const defaultCallbackUrl = `${backendOrigin}/api/payments/razorpay/callback/`;
    // Consume authoritative callback_url from backend order creation, or fallback to default
    const callbackUrl = (orderData as any).callback_url || defaultCallbackUrl;

    const options: any = {
      key: orderData.key_id,
      amount: amountPaise,
      currency: orderData.currency || "INR",
      name: "Friends Turf",
      description:
        orderData.description ||
        `Match Pass #${orderData.booking_id || orderData.order_id}`,
      order_id: orderData.order_id,
      image: `${window.location.origin}/logo.png`,
      prefill: {
        name: user?.full_name || user?.first_name || "Friends Turf Player",
        email: user?.email || "customer@friendsturf.com",
        contact: user?.phone || "9999999999",
      },
      notes: {
        booking_id: orderData.booking_id || "",
        source: "friends_turf_web",
      },
      theme: {
        color: "#059669",
      },
      modal: {
        ondismiss: function () {
          try {
            sessionStorage.removeItem("ft_active_razorpay_order");
            localStorage.removeItem("ft_active_razorpay_order");
          } catch (_) {}
          if (onDismiss) onDismiss();
        },
        escape: true,
        backdropclose: false,
        confirm_close: false,
      },
      // Redirect mode: Razorpay POSTs payment result to callback_url on our BACKEND (Render).
      // The backend verifies the signature, transitions the booking, and HTTP-302 redirects
      // the browser to friendsturf.in/confirmation/{booking_id}.
      // CRITICAL: callback_url MUST point to the backend server, NOT the static frontend.
      // Cloudflare Pages (friendsturf.in) returns HTTP 405 on POST.
      // Render (turf-bac.onrender.com) accepts POST and processes the payment.
      callback_url: callbackUrl,
      redirect: true,
      // handler() fires in standard modal mode (non-redirect). Kept as a safety net
      // in case Razorpay falls back to modal mode for certain payment methods.
      handler: function (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) {
        try {
          sessionStorage.removeItem("ft_active_razorpay_order");
          localStorage.removeItem("ft_active_razorpay_order");
        } catch (_) {}

        // Programmatically close the checkout modal immediately upon payment success.
        try {
          if (rzpInstance && typeof rzpInstance.close === "function") {
            rzpInstance.close();
          }
        } catch (_) {}

        if (onStatusChange) {
          onStatusChange("Verifying payment with Friends Turf servers...");
        }
        try {
          const res = onSuccess({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            booking_id: orderData.booking_id,
          });
          if (res instanceof Promise) {
            res.catch((err: any) => {
              if (onError) {
                onError(
                  err.response?.data?.error ||
                    "Payment verification failed on server."
                );
              }
            });
          }
        } catch (err: any) {
          if (onError) {
            onError(err.message || "Failed to process payment confirmation.");
          }
        }
      },
    };

    rzpInstance = new window.Razorpay(options);

    rzpInstance.on("payment.failed", (response: any) => {
      try {
        sessionStorage.removeItem("ft_active_razorpay_order");
        localStorage.removeItem("ft_active_razorpay_order");
      } catch (_) {}
      try {
        if (rzpInstance && typeof rzpInstance.close === "function") {
          rzpInstance.close();
        }
      } catch (_) {}
      const failReason =
        response.error?.description ||
        response.error?.reason ||
        "Payment was declined or cancelled.";
      if (onError) onError(failReason);
    });

    rzpInstance.open();
  } catch (err: any) {
    const msg =
      err?.message ||
      "Failed to open Razorpay payment popup. Please try again.";
    if (onError) onError(msg);
  }
};
