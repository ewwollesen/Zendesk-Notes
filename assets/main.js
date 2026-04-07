(function () {
  var client = ZAFClient.init();

  var orgId = null;
  var currentNotes = '';
  var canEdit = false;
  var orgUpdatedAt = null;

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
  var $updatedAt = document.getElementById('updated-at');
  var $editNotice = document.getElementById('edit-notice');
  var $editButtons = document.getElementById('edit-buttons');
  var $confirmButtons = document.getElementById('confirm-buttons');
  var $confirmSaveBtn = document.getElementById('confirm-save-btn');
  var $confirmBackBtn = document.getElementById('confirm-back-btn');

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function showError(msg) {
    hide($loading);
    hide($content);
    hide($noOrg);
    $errorText.textContent = msg;
    show($error);
  }

  function renderUpdatedAt() {
    if (!orgUpdatedAt) return;
    var d = new Date(orgUpdatedAt);
    $updatedAt.textContent = 'Last updated: ' + d.toLocaleString();
    show($updatedAt);
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
    hide($editNotice);
    hide($confirmButtons);
    show($editButtons);
    client.invoke('resize', { width: '100%', height: document.body.scrollHeight + 20 + 'px' });
  }

  function enterEditMode() {
    $notesInput.value = currentNotes;
    hide($readMode);
    show($editMode);
    show($editNotice);
    $notesInput.focus();
    client.invoke('resize', { width: '100%', height: document.body.scrollHeight + 20 + 'px' });
  }

  $editBtn.addEventListener('click', function () {
    if (!canEdit) return;
    enterEditMode();
  });
  $cancelBtn.addEventListener('click', enterReadMode);

  $saveBtn.addEventListener('click', function () {
    if (!canEdit) return;
    hide($editButtons);
    show($confirmButtons);
    client.invoke('resize', { width: '100%', height: document.body.scrollHeight + 20 + 'px' });
  });

  $confirmBackBtn.addEventListener('click', function () {
    hide($confirmButtons);
    show($editButtons);
    client.invoke('resize', { width: '100%', height: document.body.scrollHeight + 20 + 'px' });
  });

  $confirmSaveBtn.addEventListener('click', function () {
    if (!canEdit) return;
    var newNotes = $notesInput.value;
    $confirmSaveBtn.disabled = true;
    $confirmSaveBtn.textContent = 'Saving...';

    // Fetch current org state to check for concurrent edits
    client.request({
      url: '/api/v2/organizations/' + orgId + '.json',
      type: 'GET'
    }).then(function (data) {
      var latest = data.organization;
      if (orgUpdatedAt && latest.updated_at !== orgUpdatedAt) {
        // Org was modified since we last loaded — surface the conflict
        orgUpdatedAt = latest.updated_at;
        currentNotes = latest.notes || '';
        var msg = 'This organization was updated by someone else since you started editing. ' +
          'Your changes have NOT been saved. Please review the latest notes and try again.';
        renderNotes(currentNotes);
        renderUpdatedAt();
        enterReadMode();
        showError(msg);
        return;
      }

      return client.request({
        url: '/api/v2/organizations/' + orgId + '.json',
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ organization: { notes: newNotes } })
      }).then(function (resp) {
        orgUpdatedAt = resp.organization.updated_at;
        renderNotes(newNotes);
        renderUpdatedAt();
        enterReadMode();
      });
    }).catch(function (err) {
      if (err.status === 403) {
        showError('You do not have permission to edit organization notes.');
      } else {
        showError('Failed to save notes. Please try again.');
      }
      console.error(err);
    }).finally(function () {
      $confirmSaveBtn.disabled = false;
      $confirmSaveBtn.textContent = 'Confirm';
      hide($confirmButtons);
      show($editButtons);
    });
  });

  function checkEditPermission() {
    return client.get('currentUser.role').then(function (data) {
      var role = data['currentUser.role'];
      if (role === 'admin') {
        return true;
      }
      if (role !== 'agent') {
        return false;
      }
      // For agents, check if they have a restricted custom role
      return client.get('currentUser.customRole').then(function (roleData) {
        var customRole = roleData['currentUser.customRole'];
        // No custom role means a full agent (default permissions)
        if (!customRole) return true;
        // Custom roles with 'light_agent' in the name are restricted
        var config = customRole.configuration || {};
        // organization_editing is false for light/restricted roles
        if (config.organization_editing === false) return false;
        return true;
      }).catch(function () {
        // If we can't determine custom role, default to allowing
        // and let the API enforce permissions on save
        return true;
      });
    });
  }

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
    orgUpdatedAt = org.updated_at;
    $orgName.textContent = org.name;
    renderNotes(org.notes);
    renderUpdatedAt();

    return checkEditPermission().then(function (hasEdit) {
      canEdit = hasEdit;
      if (!canEdit) {
        hide($editBtn);
      }
      hide($loading);
      show($content);
      enterReadMode();
    });
  }).catch(function (err) {
    showError('Failed to load organization data.');
    console.error(err);
  });
})();
