import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useQuery } from "react-query";
import { Spinner } from "ui";
import ServiceApi from "lib/service-api";

let stripePromise = null;

export function StripeWrapper({ checkoutModel, ...props }) {
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

  // Initialize Stripe once we have the config
  if (!stripePromise && stripeConfig.data) {
    const publishableKey =
      stripeConfig.data.data.paymentProviders.stripe.config.publishableKey;
    stripePromise = loadStripe(publishableKey);
  }

  // Get payment intent
  const stripePaymentIntent = useQuery("stripePaymentIntent", () =>
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
    })
  );

  const stripeClientSecret =
    stripePaymentIntent?.data?.data?.paymentProviders?.stripe
      ?.createPaymentIntent?.client_secret;

  if (stripeConfig.loading || !stripePromise || !stripeClientSecret) {
    return <Spinner />;
  }

  const options = {
    clientSecret: stripeClientSecret,
    appearance: {
      theme: "stripe",
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <Form
        {...props}
        checkoutModel={checkoutModel}
        stripeClientSecret={stripeClientSecret}
      />
    </Elements>
  );
}
