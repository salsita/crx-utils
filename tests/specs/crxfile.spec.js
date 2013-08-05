var fs = require('fs'),
  chai = require('chai'),
  expect = chai.expect,
  CRXFile = require('../../crxfile').CRXFile;

describe('.crx file', function() {
  var crxFile;
  beforeEach(function() {
    var data = fs.readFileSync('../data/packed/test.crx', 'binary');
    crxFile = new CRXFile(data);
  });
  it('should parse the header', function() {
    crxFile.unpack(function() {
    },
    function() {
      expect(crxFile.header.version).to.eql(2);
      expect(crxFile.header.magic).to.eql('Cr24');
      expect(crxFile.header.publicKeyLength).to.eql(162);
      expect(crxFile.header.signatureLength).to.eql(128);
      expect(crxFile.header.length).to.eql(306);
    });
  });
  it('should parse the manifest', function() {
    crxFile.unpack(function() {
    },
    function() {
      expect(crxFile.manifest.name).to.eql('Dummy extension');
    });
  });
  it('should generate the extension ID', function() {
    crxFile.unpack(function() {
    },
    function() {
      expect(crxFile.extensionID.length).to.eql(32);
    });
  });
  it('should interpret localized strings', function() {
    crxFile.unpack(function() {
    },
    function() {
      var name = crxFile.manifest.name;
      var desc = crxFile.manifest.description;
      expect(crxFile.localizeMessage(name)).to.eql('Dummy extension');
      expect(crxFile.localizeMessage(desc)).to.eql('Your extension description here.');
    });
  });
  it('should extract all files', function() {
    var filepaths = [];
    crxFile.unpack(function(filepath, data) {
      filepaths.push(filepath);
      expect(data).not.to.be.null;
    },
    function() {
      expect(filepaths.length).to.eql(4);
      expect(filepaths.indexOf('manifest.json')).not.to.eql(-1);
      expect(filepaths.indexOf('_locales/')).not.to.eql(-1);
      expect(filepaths.indexOf('_locales/en/')).not.to.eql(-1);
      expect(filepaths.indexOf('_locales/en/messages.json')).not.to.eql(-1);
    });
  });
  it('should select the best icon for the requested size', function() {
    crxFile.unpack(function() {
    },
    function() {
      expect(crxFile.getBestIcon(16)).to.eql('icon16.png');
      expect(crxFile.getBestIcon(32)).to.eql('icon128.png');
      expect(crxFile.getBestIcon(48)).to.eql('icon48.png');
      expect(crxFile.getBestIcon(64)).to.eql('icon128.png');
      expect(crxFile.getBestIcon(96)).to.eql('icon128.png');
      expect(crxFile.getBestIcon(128)).to.eql('icon128.png');
    });
  });
});