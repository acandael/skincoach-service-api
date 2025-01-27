import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

let stripePromise = null;

export function StripeWrapper({ publishableKey, children }) {
  const [stripe, setStripe] = useState(null);

  useEffect(() => {
    if (!stripePromise && publishableKey) {
      stripePromise = loadStripe(publishableKey);
      stripePromise.then(setStripe);
    }
  }, [publishableKey]);

  if (!stripe) {
    return null;
  }

  return <Elements stripe={stripe}>{children}</Elements>;
}
