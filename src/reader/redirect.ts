const destination = document.querySelector<HTMLAnchorElement>(
  "a[data-law-redirect]",
);
if (destination) {
  const url = new URL(destination.href);
  url.search = window.location.search;
  url.hash = window.location.hash;
  window.location.replace(url.href);
}
