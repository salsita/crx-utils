(function() {
	var crypto = require('crypto');
  var _s = require('underscore.string');

  function CRXFile(data) {
    this._data = data;
  }

  CRXFile.prototype = {
    parseCRXHeader: function() {
      var header = {};
      header.magic = this._data.substr(0, 4);
      header.version = this._readUint32FromString(this._data, 4);
      header.publicKeyLength = this._readUint32FromString(this._data, 8);
      header.signatureLength = this._readUint32FromString(this._data, 12);
      header.publicKey = this._data.substr(16, this.publicKeyLength);
      header.signature = this._data.substr(16 + this.publicKeyLength, this.signatureLength);
      header.length = 16 + header.publicKeyLength + header.signatureLength;
      return header;
    },

    generateExtensionID: function(publicKey) {
      var sha256 = crypto.createHash('sha256');
      sha256.update(publicKey, 'binary');
      var sha = sha256.digest('hex').substr(0, 32);
      var charCode = 'a'.charCodeAt(0);
      var remapped = '';
      for (var i=0; i<sha.length; i++) {
        remapped += String.fromCharCode(parseInt(sha[i], 16) + charCode)[0];
      }
      return remapped;
    },

    getBestIcon: function(manifest, preferredSize) {
      var icons = manifest.icons;
      if (icons) {
        var bestSize = 0;
        // Simpleminded algorithm to get best icon size.
        // Optimal is 48x48, otherwise use the largest one available.
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
    },

    unpack: function(ZipConstructor, fileCallback, doneCallback) {
      var crxHeader = this.parseCRXHeader();
      var zip = new ZipConstructor(this._data.substr(crxHeader.length));
      var manifest;

      for (var index in zip.files) {
        var zipEntry = zip.files[index];
        var filename = zipEntry.name;
        fileCallback(filename, zipEntry.asBinary());
        if ('manifest.json' === filename) {
          manifest = zipEntry.asText();
        }
      }

      doneCallback(crxHeader, JSON.parse(manifest));
    },

    _readUint32FromString: function(str, offset) {
      return str.charCodeAt(offset) +
        str.charCodeAt(offset+1) * 256 +
        str.charCodeAt(offset+2) * (256+256) +
        str.charCodeAt(offset+3) * (256*256*256);
    }
  };

  exports.CRXFile = CRXFile;
}).call(this);
