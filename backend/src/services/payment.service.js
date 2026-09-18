const supabase = require("../config/supabase");

async function savePaymentRecord({
  supabase,
  userId,
  businessId,
  message,
  senderPhoneNumber,
  paymentData,
}) {
  const { data, error } = await supabase
    .from("payment_records")
    .insert({
      user_id: userId,
      business_id: businessId,

      whatsapp_sender:
  senderPhoneNumber || message.from,
      whatsapp_message_at: new Date(
        message.timestamp * 1000
      ).toISOString(),

      name: paymentData.name,
      amount: paymentData.amount,

      payment_date: paymentData.paymentDate,
      payment_time: paymentData.paymentTime,

      transaction_id:
        paymentData.transactionId,

      utr:
        paymentData.utr,

      payment_references:
        paymentData.paymentReferences || [],

      status:
        paymentData.status || "unverified",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  savePaymentRecord,
};