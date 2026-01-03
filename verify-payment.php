<?php

header('Content-Type: application/json');

if (!isset($_GET['reference'])) {
    echo json_encode(["status" => "error", "message" => "No reference supplied"]);
    exit;
}

$reference = $_GET['reference'];
$secret_key = "sk_test_YOUR_SECRET_KEY_HERE"; // Replace with your actual Paystack secret key

$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => "https://api.paystack.co/transaction/verify/" . rawurlencode($reference),
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        "Authorization: Bearer $secret_key",
        "Cache-Control: no-cache",
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

$result = json_decode($response, true);

if ($result && isset($result["data"]["status"]) && $result["data"]["status"] === "success") {

    // TODO: save order to database here if needed

    echo json_encode(["status" => "success"]);
} else {
    echo json_encode(["status" => "failed"]);
}
