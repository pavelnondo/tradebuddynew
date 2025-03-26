
  // Handle checklist selection change
  const handleChecklistChange = async (checklistId: string) => {
    // If "none" is selected, set to undefined (no checklist)
    if (checklistId === "none") {
      form.setValue('checklist_id', undefined);
      setSelectedChecklist(null);
      setChecklistItems([]);
      return;
    }
    
    form.setValue('checklist_id', checklistId);
    
    const checklist = await getChecklist(checklistId);
    if (checklist) {
      setSelectedChecklist(checklist);
      setChecklistItems(checklist.items.map(item => ({ ...item, completed: false })));
    }
  };
