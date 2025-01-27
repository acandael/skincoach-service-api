import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "react-query";
import { Spinner } from "ui";
import ServiceApi from "lib/service-api";
import { Form } from "./Form";

let stripePromise = null;

export function StripeWrapper({ checkoutModel, onSuccess, onError }) {
  // Get Stripe config
  const stripeConfig = useQuery("stripeConfig", () =>
    ServiceApi({
      query: `
      {
        paymentProviders {
          stripe {
            config
          }
        }
      }
    `,
    })
  );

  // Get payment intent
  const stripePaymentIntent = useQuery(
    ["stripePaymentIntent", checkoutModel],
    () =>
      ServiceApi({
        query: `
          mutation StripePaymentIntent($checkoutModel: CheckoutModelInput!) {
            paymentProviders {
              stripe {
                createPaymentIntent(checkoutModel: $checkoutModel)
              }
            }
          }
        `,
        variables: {
          checkoutModel,
        },
      }),
    {
      enabled: !!checkoutModel,
    }
  );

  // Initialize Stripe once we have the config
  if (!stripePromise && stripeConfig.data) {
    const publishableKey =
      stripeConfig.data.data.paymentProviders.stripe.config.publishableKey;
    stripePromise = loadStripe(publishableKey);
  }

  const stripeClientSecret =
    stripePaymentIntent?.data?.data?.paymentProviders?.stripe
      ?.createPaymentIntent?.client_secret;

  if (
    stripeConfig.isLoading ||
    stripePaymentIntent.isLoading ||
    !stripePromise ||
    !stripeClientSecret
  ) {
    return <Spinner />;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: stripeClientSecret,
        appearance: {
          theme: "stripe",
        },
      }}
    >
      <Form
        checkoutModel={checkoutModel}
        stripeClientSecret={stripeClientSecret}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  );
}
