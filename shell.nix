{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Node.js and package managers
    nodejs_22
    yarn
    
    # PHP and Composer
    php83
    php83Packages.composer
    
    # WordPress CLI tools
    wp-cli
    
    # Development tools
    git
    curl
    wget
    
    # Optional: For better shell experience
    bash-completion
  ];

  # Set environment variables and bootstrap project
  shellHook = ''
    echo "🚀 Streamery Forms Development Environment"
    echo "Node.js: $(node --version)"
    echo "npm: $(npm --version)"
    echo "PHP: $(php --version | head -n 1)"
    echo "Composer: $(composer --version | head -n 1)"
    if command -v wp >/dev/null 2>&1; then
      echo "WP-CLI: $(wp --info | head -n 1)"
    fi
    echo ""
    echo "Available commands:"
    echo "  npm run dev          - Start development servers"
    echo "  npm run build         - Build for production"
    echo "  composer install     - Install PHP dependencies"
    echo ""
    # Auto-install Node dependencies if missing
    if [ -f package.json ] && [ ! -d node_modules ]; then
      echo "Installing Node.js dependencies (npm install)..."
      npm install
    fi

    # Auto-install PHP dependencies if missing
    if [ -f composer.json ] && [ ! -d vendor ]; then
      echo "Installing PHP dependencies (composer install)..."
      composer install
    fi
  '';

  # Ensure npm uses the correct Node.js version
  NODE_ENV = "development";
}

