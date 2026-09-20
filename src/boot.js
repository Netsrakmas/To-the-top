// Catch failed module loads too; no indefinitely unresponsive title screen.
import('./main.js').catch(error => {
  console.error('Unable to start To the Top:', error);
  document.getElementById('load-error').hidden = false;
  document.getElementById('reload').onclick = () => location.reload();
});
