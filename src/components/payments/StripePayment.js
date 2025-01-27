import { useState, useEffect } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "ui";
import { useT } from "lib/i18n";

export function StripePayment({ checkoutModel, onSuccess, onError }) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log("Stripe not initialized", { stripe, elements });
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Get card element
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create payment method
      const {
        error: methodError,
        paymentMethod,
      } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: `${checkoutModel.customer.firstName} ${checkoutModel.customer.lastName}`,
          email: checkoutModel.customer.email,
          address: {
            line1: checkoutModel.customer.streetAddress,
            postal_code: checkoutModel.customer.postalCode,
            city: checkoutModel.customer.city,
            country: checkoutModel.customer.country || "BE",
          },
        },
      });

      if (methodError) {
        throw methodError;
      }

      // Confirm the payment
      const {
        error: confirmError,
        paymentIntent,
      } = await stripe.confirmCardPayment(
        checkoutModel.paymentIntentId, // Make sure this is passed from your checkout
        {
          payment_method: paymentMethod.id,
        }
      );

      if (confirmError) {
        throw confirmError;
      }

      if (paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message);
      onError(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <Button
        type="submit"
        disabled={!stripe || processing}
        state={processing ? "loading" : null}
      >
        {t("checkout.payNow")}
      </Button>
    </form>
  );
}
