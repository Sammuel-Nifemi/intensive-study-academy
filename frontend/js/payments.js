

  function showPaymentModal(reason, amount) {
    document.getElementById("paymentReason").innerText = reason;
    document.getElementById("paymentAmount").innerText =
      `Amount: ₦${amount}`;

    document.getElementById("paymentModal").style.display = "block";

    // future: trigger email alert here
    console.log("Payment alert should be emailed");
  }

  function closePaymentModal() {
    document.getElementById("paymentModal").style.display = "none";
  }

  function proceedToPayment() {
    alert("Payment gateway will be connected here.");
    closePaymentModal();
  }
export const paymentRecords = [
  {
    studentId: "NOU233396887",
    feeType: "exam",
    status: "paid"
  },
  {
    studentId: "NOU233396887",
    feeType: "semester",
    status: "paid"
  },
  {
    studentId: "NOU233396887",
    feeType: "acceptance",
    status: "unpaid"
  }
];
