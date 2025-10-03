const glitch = document.querySelector('.glitch');
  const speed = 1; // You can change this
  const enableShadows = true;

  glitch.style.setProperty('--after-duration', `${speed*3}s`);
  glitch.style.setProperty('--before-duration', `${speed*2}s`);
  glitch.style.setProperty('--after-shadow', enableShadows ? '-5px 0 red' : 'none');
  glitch.style.setProperty('--before-shadow', enableShadows ? '5px 0 cyan' : 'none');