(function () {
  var client = ZAFClient.init();

  var orgId = null;
  var currentNotes = '';

  var $loading = document.getElementById('loading');
  var $noOrg = document.getElementById('no-org');
  var $content = document.getElementById('content');
  var $error = document.getElementById('error');
  var $errorText = document.getElementById('error-text');
  var $orgName = document.getElementById('org-name');
  var $notesDisplay = document.getElementById('notes-display');
  var $notesInput = document.getElementById('notes-input');
  var $readMode = document.getElementById('read-mode');
  var $editMode = document.getElementById('edit-mode');
  var $editBtn = document.getElementById('edit-btn');
  var $saveBtn = document.getElementById('save-btn');
  var $cancelBtn = document.getElementById('cancel-btn');

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function showError(msg) {
    hide($loading);
    hide($content);
    hide($noOrg);
    $errorText.textContent = msg;
    show($error);
  }

  function renderNotes(notes) {
    currentNotes = notes || '';
    if (currentNotes) {
      $notesDisplay.textContent = currentNotes;
      $notesDisplay.classList.remove('empty');
    } else {
      $notesDisplay.textContent = 'No notes yet.';
      $notesDisplay.classList.add('empty');
    }
  }

  function enterReadMode() {
    show($readMode);
    hide($editMode);
    client.invoke('resize', { width: '100%', height: document.body.scrollHeight + 20 + 'px' });
  }

  function enterEditMode() {
    $notesInput.value = currentNotes;
    hide($readMode);
    show($editMode);
    $notesInput.focus();
    client.invoke('resize', { width: '100%', height: document.body.scrollHeight + 20 + 'px' });
  }

  $editBtn.addEventListener('click', enterEditMode);
  $cancelBtn.addEventListener('click', enterReadMode);

  $saveBtn.addEventListener('click', function () {
    var newNotes = $notesInput.value;
    $saveBtn.disabled = true;
    $saveBtn.textContent = 'Saving...';

    client.request({
      url: '/api/v2/organizations/' + orgId + '.json',
      type: 'PUT',
      contentType: 'application/json',
      data: JSON.stringify({ organization: { notes: newNotes } })
    }).then(function () {
      renderNotes(newNotes);
      enterReadMode();
    }).catch(function (err) {
      showError('Failed to save notes. Please try again.');
      console.error(err);
    }).finally(function () {
      $saveBtn.disabled = false;
      $saveBtn.textContent = 'Save';
    });
  });

  // Load org data
  client.get('ticket.requester.id').then(function (data) {
    var requesterId = data['ticket.requester.id'];

    return client.request({
      url: '/api/v2/users/' + requesterId + '/organizations.json',
      type: 'GET'
    });
  }).then(function (data) {
    var orgs = data.organizations;
    if (!orgs || orgs.length === 0) {
      hide($loading);
      show($noOrg);
      return;
    }

    var org = orgs[0];
    orgId = org.id;
    $orgName.textContent = org.name;
    renderNotes(org.notes);

    hide($loading);
    show($content);
    enterReadMode();
  }).catch(function (err) {
    showError('Failed to load organization data.');
    console.error(err);
  });
})();
