!function(e){function t(i){if(n[i])return n[i].exports;var o=n[i]={i:i,l:!1,exports:{}};return e[i].call(o.exports,o,o.exports,t),o.l=!0,o.exports}var n={};t.m=e,t.c=n,t.d=function(e,n,i){t.o(e,n)||Object.defineProperty(e,n,{configurable:!1,enumerable:!0,get:i})},t.n=function(e){var n=e&&e.__esModule?function(){return e.default}:function(){return e};return t.d(n,"a",n),n},t.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},t.p="",t(t.s=29)}({29:function(e,t,n){"use strict";function i(e){return/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(e)}function o(e){if("email"===e&&(i($("#email-input").val())?(r=!0,$("#email-help").hide(),o()):(r=!1,$("#email-help").show(),$("#submit-button").prop("disabled",!0).prop("title","You need to enter a valid email address. "))),"message"!==e)return r&&s?($("#submit-button").prop("disabled",!1).prop("title","Click here to send your message. "),!0):($("#submit-button").prop("disabled",!0).prop("title","Edit the form before clicking send. "),!1);""===$("#message-input").val()?(s=!1,$("#message-help").show(),$("#submit-button").prop("disabled",!0).prop("title","You need to enter a message. ")):(s=!0,$("#message-help").hide(),o())}var r,s;$(function(){r=!!i($("#email-input").val()),s=""===!$("#message-input").val(),setTimeout(o,1e3)}),window.onSubmit=function(){o()&&$("#contact-form").submit()},$("#email-input").change(function(){o("email")}),$("#message-input").change(function(){o("message")})}});