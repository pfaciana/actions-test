<?php

/*
Plugin Name: GitHub Actions Testing
Plugin URI: https://renderdev.com/
Author: Render Dev
Author URI: https://renderdev.com/
Description: Debugging
Version: 0.0.1
Requires: 6.1.0
Tested: 6.1.0
*/


require __DIR__ . '/vendor/autoload.php';

use SebastianBergmann\Timer\Timer;

$timer = new Timer;

$timer->start();

usleep( 123456 );

$duration = $timer->stop();

echo round( $duration->asMilliseconds() ) . ' ms';
