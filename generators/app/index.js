var Generator = require("yeoman-generator");

module.exports = class extends Generator {
  //yo apigee-proxy <proxy_name> <base_path> <apigee_username> <apigee_password> <organization> <environment>
  constructor(args, opts) {
    super(args, opts);

    this.argument("proxy_name", { type: String, required: true });
    this.argument("base_path", { type: String, required: true });
    this.argument("apigee_username", { type: String, required: false });
    this.argument("apigee_password", { type: String, required: false });
    this.argument("organization", { type: String, required: false });
    this.argument("environment", { type: String, required: false });
  }

  initializing() {
    //this.log("initializing");
    this.config.save();
  }

  async prompting() {
    //this.log("prompting");
  }

  configuring() {
    //this.log("configuring");
  }

  writing() {
    this._copyFilesWithoutTemplate();
    this._copyFilesWithTemplate();
  }

  _copyFilesWithoutTemplate() {
    this.fs.copy(
      this.templatePath("apiproxy"),
      this.destinationPath("target/apiproxy"),
      {
        globOptions: {
          ignore: [
            "**/apiproxy/helloworld.xml",
            "**/apiproxy/proxies/default.xml"
          ]
        }
      }
    );
  }

  _copyFilesWithTemplate() {
    var tplValues = {
      proxy_name: this.options.proxy_name,
      apigee_username: this.options.apigee_username,
      base_path: this.options.base_path
    };
    this.log(
      "Generating Apigee proxy with parameters: ",
      JSON.stringify(tplValues, null, 2)
    );

    this.fs.copyTpl(
      this.templatePath("apiproxy/helloworld.xml"),
      this.destinationPath(
        "target/apiproxy/" + this.options.proxy_name + ".xml"
      ),
      tplValues
    );

    this.fs.copyTpl(
      this.templatePath("apiproxy/proxies/default.xml"),
      this.destinationPath("target/apiproxy/proxies/default.xml"),
      tplValues
    );
  }

  _deployProxy(deployResult) {
    var apigeetool = require("apigeetool");
    var sdk = apigeetool.getPromiseSDK();
    var opts = {
      organization: this.options.organization,
      username: this.options.apigee_username,
      password: this.options.apigee_password,
      environments: this.options.environment
    };
    opts.api = this.options.proxy_name;
    opts.directory = this.destinationPath("target");

    this.log("Starting Apigee proxy deployment...");
    sdk.deployProxy(opts).then(
      function(result) {
        deployResult(result, null);
      },
      function(err) {
        deployResult(null, err);
      }
    );
  }

  async end() {
    if (this.options.apigee_username && this.options.apigee_password && this.options.organization && this.options.environment) {
      await this._deployProxy((result, err) => {
        if (result) {
          this.log("Apigee proxy deployed successfully: " + JSON.stringify(result, null, 2));
          this.log("Thanks for using Apigee Proxy generator!");
        }
        if (err) {
          this.log("Deployment failed: " + err);
        }
      });
    } else {
      this.log("Skipped proxy deployment. Thanks for using Apigee Proxy generator!");
    }
  }
};
