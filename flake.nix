{
  description = "Gather Town Electron Wrapper";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "gather-electron";
          version = "1.0.0";

          # Use the current directory as the source
          src = ./.;

          nativeBuildInputs = [ pkgs.makeWrapper ];

          # No build needed (just copying files)
          dontBuild = true;

          installPhase = ''
            # 1. Create directory for app source
            mkdir -p $out/libexec/gather-electron
            
            # 2. Copy the main files
            cp main.js package.json $out/libexec/gather-electron/

            # 3. Create the binary wrapper
            # This creates a 'gather-electron' command that runs: 
            # electron /path/to/app --enable-features=WebRTCPipeWireCapturer
            makeWrapper ${pkgs.electron}/bin/electron $out/bin/gather-electron \
              --add-flags "$out/libexec/gather-electron" \
              --add-flags "--enable-features=WebRTCPipeWireCapturer"

            mkdir -p $out/share/applications
            cp gather.desktop $out/share/applications/
          '';
        };

        # This allows you to run `nix run` immediately
        apps.default = flake-utils.lib.mkApp {
          drv = self.packages.${system}.default;
        };
      }
    );
}
