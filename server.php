<?php

require_once __DIR__.'/vendor/autoload.php';

use Ratchet\ConnectionInterface;
use Ratchet\Wamp\WampServerInterface;
use Ratchet\Wamp\WampConnection;

class Pusher implements WampServerInterface {
    protected $topics = [];
    protected $redis;

    public function __construct($redis) {
        $this->redis = $redis;
    }
    public function onSubscribe(ConnectionInterface $conn, $topic) {
        echo "Client subscribed" . PHP_EOL;
        $this->topics[$topic->getId()] = $topic;
        $this->redis->lrange('workers', 0, -1, function ($reply) use ($conn) {
            if ($reply instanceof Predis\Response\Error) {
                echo $reply;
                return;
            }
            $msg = ['workers' => $reply, 'type' => 'INIT'];
            $conn->event('all', json_encode($msg));
        });
    }
    public function onUnSubscribe(ConnectionInterface $conn, $topic) {
        echo "Client unsubscribed" . PHP_EOL;
    }
    public function onOpen(ConnectionInterface $conn) {
        echo "Client opened" . PHP_EOL;
    }
    public function onClose(ConnectionInterface $conn) {
        echo "Client closed" . PHP_EOL;
    }
    public function onCall(ConnectionInterface $conn, $id, $topic, array $params) {
        $conn->callError($id, $topic, 'You are not allowed to make calls')->close();
    }
    public function onPublish(ConnectionInterface $conn, $topic, $event, array $exclude, array $eligible) {
        $conn->close();
    }
    public function onError(ConnectionInterface $conn, \Exception $e) {
    }

    public function broadcast($topic, $msg) {
        if (isset($this->topics[$topic])) {
            $this->topics[$topic]->broadcast($msg);
        }
    }
}

$loop = React\EventLoop\Factory::create();
$client = new Predis\Async\Client('tcp://127.0.0.1:6379', $loop);
$redis = new Predis\Async\Client('tcp://127.0.0.1:6379', $loop);

$pusher = new \Pusher($redis);

$client->connect(function ($client) use ($loop, $pusher) {
        echo "Connected to Redis, now listening for incoming messages...\n";

        $client->pubSubLoop('work', function ($event) use ($pusher) {
                echo "Broadcasting {$event->payload} to all" . PHP_EOL;
                $pusher->broadcast('all', $event->payload);
            });
    });

$socket = new React\Socket\Server($loop);
$socket->listen(1337);
$webServer = new Ratchet\Server\IoServer(
    new Ratchet\Http\HttpServer(
        new Ratchet\WebSocket\WsServer(
            new Ratchet\Wamp\WampServer(
                $pusher
            )
        )
    ),
    $socket
);

$loop->run();
