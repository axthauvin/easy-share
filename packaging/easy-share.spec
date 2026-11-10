# RPM spec for Easy-Share (Fedora / RHEL / openSUSE).
# Built by scripts/build-rpm.sh, which packages the Electron app with
# electron-builder (--dir) and passes the following macros:
#   _es_version  version from package.json
#   _es_appdir   absolute path to dist/linux-unpacked
#   _es_icon     absolute path to public/icon.png

# Prebuilt Electron binaries: no debuginfo, no stripping, no auto deps on bundled libs
%global debug_package %{nil}
%global __os_install_post %{nil}
%global _build_id_links none
%global __provides_exclude_from ^/opt/Easy-Share/.*$
%global __requires_exclude_from ^/opt/Easy-Share/.*$

Name:           easy-share
Version:        %{_es_version}
Release:        1%{?dist}
Summary:        Simple local network text sharing tool
License:        ISC
URL:            https://github.com/Axthauvin/easy-share
ExclusiveArch:  x86_64 aarch64

Requires:       gtk3
Requires:       nss
Requires:       libnotify
Requires:       libXtst
Requires:       xdg-utils
Requires:       at-spi2-core
Requires:       libuuid

%description
Easy-Share is a desktop application and lightweight web service designed to
instantly share files and text between all your devices over local Wi-Fi network.

%prep

%build

%install
install -d %{buildroot}/opt/Easy-Share
cp -a %{_es_appdir}/. %{buildroot}/opt/Easy-Share/

install -d %{buildroot}%{_bindir}
ln -s /opt/Easy-Share/easy-share %{buildroot}%{_bindir}/easy-share

install -Dm644 %{_es_icon} %{buildroot}%{_datadir}/icons/hicolor/512x512/apps/easy-share.png

install -d %{buildroot}%{_datadir}/applications
cat > %{buildroot}%{_datadir}/applications/easy-share.desktop <<'DESKTOP'
[Desktop Entry]
Name=Easy-Share
Exec=/opt/Easy-Share/easy-share %U
Terminal=false
Type=Application
Icon=easy-share
StartupWMClass=Easy-Share
Comment=Simple local network text sharing tool
Categories=Utility;
DESKTOP

%files
/opt/Easy-Share
%{_bindir}/easy-share
%{_datadir}/applications/easy-share.desktop
%{_datadir}/icons/hicolor/512x512/apps/easy-share.png
