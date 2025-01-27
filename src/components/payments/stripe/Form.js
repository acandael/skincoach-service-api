import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "ui";
import { useT } from "lib/i18n";
import { useState } from "react";
import ServiceApi from "lib/service-api";

export function Form({
  stripeClientSecret,
  checkoutModel,
  onSuccess,
  onError,
}) {
  const t = useT();
  const stripe = useStripe();
  const elements = useElements();
  const [status, setStatus] = useState("idle");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!stripe || !elements) {
      console.log("Stripe not initialized", { stripe, elements });
      return;
    }

    setStatus("confirming");

    try {
      const { customer } = checkoutModel;
      const cardElement = elements.getElement(CardElement);

      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Create idempotency key for payment confirmation
      const confirmationKey = `confirm_${stripeClientSecret}`;

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        stripeClientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${customer.firstName} ${customer.lastName}`,
              email: customer.email,
              address: {
                line1: customer.streetAddress,
                postal_code: customer.postalCode,
                city: customer.city,
                country: customer.country || "BE",
              },
            },
          },
        },
        {
          idempotencyKey: confirmationKey,
        }
      );

      if (error) {
        throw error;
      }

      if (paymentIntent.status === "succeeded") {
        const response = await ServiceApi({
          query: `
            mutation confirmStripeOrder($checkoutModel: CheckoutModelInput!, $paymentIntentId: String!) {
              paymentProviders {
                stripe {
                  confirmOrder(checkoutModel: $checkoutModel, paymentIntentId: $paymentIntentId) {
                    success
                    orderId
                  }
                }
              }
            }
          `,
          variables: {
            checkoutModel,
            paymentIntentId: paymentIntent.id,
          },
        });

        const {
          success,
          orderId,
        } = response.data.paymentProviders.stripe.confirmOrder;

        if (success) {
          setStatus("success");
          onSuccess(orderId);
        } else {
          throw new Error("Order confirmation failed");
        }
      }
    } catch (err) {
      console.error("Payment processing error:", err);
      setStatus("error");
      onError(err);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
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
      <div style={{ marginTop: 25 }}>
        <Button
          type="submit"
          state={status === "confirming" ? "loading" : null}
          disabled={!stripe || status === "confirming"}
        >
          {t("checkout.payNow")}
        </Button>
      </div>
    </form>
  );
}
