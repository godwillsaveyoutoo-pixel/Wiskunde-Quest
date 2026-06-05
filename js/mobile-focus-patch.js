
(function(){
  "use strict";

  function updateMobileGameClass(){
    const grid = document.getElementById("gameGrid");
    if (!grid) return;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    grid.classList.toggle("mobileFocusMode", mobile);
  }

  document.addEventListener("DOMContentLoaded", updateMobileGameClass);
  window.addEventListener("resize", updateMobileGameClass);
  window.addEventListener("orientationchange", updateMobileGameClass);
})();
