const revealElements = document.querySelectorAll(".reveal");
const filterButtons = document.querySelectorAll(".filter-btn");
const packageItems = document.querySelectorAll(".package-item");
const packageButtons = document.querySelectorAll(".btn-package");
const packageSelect = document.querySelector("#package");
const contactForm = document.querySelector("#contactForm");
const formResponse = document.querySelector("#formResponse");
const navbarCollapse = document.querySelector("#mainNavbar");
const navLinks = document.querySelectorAll(".navbar-nav a");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

revealElements.forEach((element) => revealObserver.observe(element));

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedFilter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    packageItems.forEach((item) => {
      const shouldShow = selectedFilter === "all" || item.dataset.category === selectedFilter;
      item.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

packageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const selectedPackage = button.dataset.package;

    if (packageSelect && selectedPackage) {
      packageSelect.value = selectedPackage;
    }
  });
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    if (navbarCollapse && navbarCollapse.classList.contains("show")) {
      bootstrap.Collapse.getOrCreateInstance(navbarCollapse).hide();
    }
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    formResponse.textContent = "Solicitud recibida. BRUMA te contactara para coordinar el servicio.";
    contactForm.reset();
  });
}
