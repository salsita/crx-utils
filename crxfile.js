(function() {
	var path = require('path'),
    crypto = require('crypto'),
    _s = require('underscore.string'),
    Zip = require('node-zip');

  var MESSAGE_PREFIX = '__MSG_',
    DEFAULT_LOCALE = 'en';

  function parseCRXHeader(data) {
    var header = {};
    header.magic = data.substr(0, 4);
    header.version = readUint32FromString(data, 4);
    header.publicKeyLength = readUint32FromString(data, 8);
    header.signatureLength = readUint32FromString(data, 12);
    header.publicKey = data.substr(16, header.publicKeyLength);
    header.signature = data.substr(16 + header.publicKeyLength, header.signatureLength);
    header.length = 16 + header.publicKeyLength + header.signatureLength;
    return header;
  }

  function generateExtensionID() {
    var sha256 = crypto.createHash('sha256');
    sha256.update(publicKey, 'binary');
    var sha = sha256.digest('hex').substr(0, 32);
    var charCode = 'a'.charCodeAt(0);
    var remapped = '';
    for (var i=0; i<sha.length; i++) {
      remapped += String.fromCharCode(parseInt(sha[i], 16) + charCode)[0];
    }
    return remapped;
  }

  function readUint32FromString(str, offset) {
    return str.charCodeAt(offset) +
      str.charCodeAt(offset+1) * 256 +
      str.charCodeAt(offset+2) * (256+256) +
      str.charCodeAt(offset+3) * (256*256*256);
  }

  function CRXFile(data) {
    this._data = data;
    this._header = null;
    this._manifest = null;
    this._extensionId = null;
    this._locales = {};
  }

  CRXFile.prototype = {
    get header() {
      return this._header;
    },

    get manifest() {
      return this._manifest;
    },

    localizeMessage: function(msg, locale) {
      locale = locale || DEFAULT_LOCALE;
      if (_s.startsWith(msg, MESSAGE_PREFIX)) {
        return this._locales[locale][msg.substr(MESSAGE_PREFIX.length)].message;
      }
    },

    unpack: function(fileCallback, doneCallback) {
      this._header = parseCRXHeader(this._data);
      var zip = new Zip(this._data.substr(this._header.length));
      var manifest;

      for (var index in zip.files) {
        var zipEntry = zip.files[index];
        var filename = zipEntry.name;
        fileCallback(filename, zipEntry.asBinary());
        if ('manifest.json' === filename) {
          this._manifest = JSON.parse(zipEntry.asText());
        }
        else if (_s.endsWith(filename, 'messages.json')) {
          var segments = filename.split(path.sep);
          if (3 === segments.length &&
            '_locales' === segments[0] &&
            'messages.json' === segments[2]) {
            this._locales[segments[1]] = JSON.parse(zipEntry.asText());
          }
        }
      }

      doneCallback();
    },

    getBestIcon: function(preferredSize) {
      var icons = this._manifest.icons;
      if (icons) {
        var bestSize = 0;
        // Simpleminded algorithm to get best icon size.
        // Optimal is exact match, otherwise use the largest one available.
        for (var sizeStr in icons) {
          var size = parseInt(sizeStr, 10);
          if (preferredSize === size) {
            // Optimal size
            bestSize = size;
            break;
          }
          else if (size > bestSize) {
            bestSize = size;
          }
        }
        if (bestSize) {
          return icons[bestSize];
        }
      }
    }
  };

  exports.CRXFile = CRXFile;
}).call(this);
