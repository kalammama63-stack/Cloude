<?php
// Приём заявок с формы сайта, отправка в Telegram.
// Заменяет Cloudflare Worker — работает на том же хостинге (Beget), без зависимости от Cloudflare.

$BOT_TOKEN = '8746557189:AAGmEHb7kEvdcQ63e1NWBdpnoVECY7I13L0';
$CHAT_ID   = '8715001372';

$ALLOWED_ORIGINS = [
    'https://tk-webb.ru',
    'https://www.tk-webb.ru',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowOrigin = in_array($origin, $ALLOWED_ORIGINS, true) ? $origin : $ALLOWED_ORIGINS[0];

header("Access-Control-Allow-Origin: $allowOrigin");
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Invalid JSON']);
    exit;
}

$name    = trim($body['name'] ?? '');
$contact = trim($body['contact'] ?? '');
$message = trim($body['message'] ?? '');
$service = trim($body['service'] ?? '');

if ($name === '' || $contact === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'Missing fields']);
    exit;
}

$serviceLabel = $service !== '' ? "\n🎯 Интерес: {$service}" : '';
$text = "📬 Новая заявка с сайта TK Web\n\n"
    . "👤 Имя: {$name}\n"
    . "📞 Контакт: {$contact}"
    . $serviceLabel
    . ($message !== '' ? "\n💬 Сообщение: {$message}" : '');

$ch = curl_init("https://api.telegram.org/bot{$BOT_TOKEN}/sendMessage");
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS     => json_encode([
        'chat_id'    => $CHAT_ID,
        'text'       => $text,
        'parse_mode' => 'HTML',
    ]),
]);
$response = curl_exec($ch);
curl_close($ch);

$tgData = json_decode($response, true);
$ok = $tgData['ok'] ?? false;

http_response_code($ok ? 200 : 502);
echo json_encode(['ok' => $ok]);
