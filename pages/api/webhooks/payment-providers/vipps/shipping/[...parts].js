/**
 * Might be called by Vipps during checkout to retrieve the
 * shipping details
 *
 */

// import vippsService from "../../../../../../src/services/payment-providers/vipps";

export default async function webhookVippsShippingDetails(req, res) {
  // const crystallizeOrderId = req.query.parts[req.query.parts.length - 2];
  console.log("webhookVippsShippingDetails");
  console.log(req.query.parts);
  // await vippsService.orderUpdate({ crystallizeOrderId });

  res.send({});
}
