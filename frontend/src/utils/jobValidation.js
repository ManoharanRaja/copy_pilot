export function validateJob(form) {
  const errors = {};
  // Simple file mask regex (e.g. *.csv, file_*.txt)
  const fileMaskRegex = /^(\*|\w+|\w+\*|\*\.\w+|\w+\.\w+|\w+\*\.?\w*)$/;
  // Direct file name regex (e.g. test.csv)
  const directFileNameRegex = /^[\w,\s-]+\.[A-Za-z]{2,}$/;

  // Placeholder pattern: [$SOMETHING]
  const placeholderRegex = /^\[\$\w+\]$/;
  // Allow folder paths with placeholders as segments
  const folderSegmentRegex = /^([\w\-\s\.]+|\[\$\w+\])$/;

  function isValidFolderPath(path) {
    if (!path) return false;
    const segments = path.split(/[\\/]/).filter(Boolean); // filter out empty segments
    for (const seg of segments) {
      if (!folderSegmentRegex.test(seg)) {
        console.log("Invalid segment:", seg);
        return false;
      }
    }
    return true;
  }

  // 1. Source Folder validation (cannot be a file path)
  if (
    !isValidFolderPath(form.source) ||
    (() => {
      const segments = form.source.split(/[\\/]/);
      const last = segments[segments.length - 1];
      // Only flag as error if last segment is a file name (with .ext) and not a placeholder
      return /\.[\w]+$/.test(last) && !placeholderRegex.test(last);
    })()
  ) {
    errors.source =
      "Enter a valid folder path (not a file path). Placeholders like [$NAME] are allowed as segments.";
  }

  // 1. Target Folder validation (cannot be a file path)
  if (
    form.target &&
    (!isValidFolderPath(form.target) ||
      (() => {
        const segments = form.target.split(/[\\/]/);
        const last = segments[segments.length - 1];
        return /\.[\w]+$/.test(last) && !placeholderRegex.test(last);
      })())
  ) {
    errors.target =
      "Enter a valid folder path (not a file path). Placeholders like [$NAME] are allowed as segments.";
  }

  // 2. If Source File Mask is blank, Target File Mask must also be blank
  if (
    (!form.sourceFileMask || form.sourceFileMask.trim() === "") &&
    form.targetFileMask &&
    form.targetFileMask.trim() !== ""
  ) {
    errors.targetFileMask =
      "Target File Mask should be blank if Source File Mask is blank.";
  }

  // 3. If Source File Mask is a direct file name, Target File Mask must also be a direct file name
  if (
    form.sourceFileMask &&
    directFileNameRegex.test(form.sourceFileMask) &&
    form.targetFileMask &&
    !directFileNameRegex.test(form.targetFileMask)
  ) {
    errors.targetFileMask =
      "Target File Mask should also be a direct file name if Source File Mask is a direct file name.";
  }

  // Source File Mask validation
  if (
    form.sourceFileMask &&
    !placeholderRegex.test(form.sourceFileMask) &&
    !fileMaskRegex.test(form.sourceFileMask) &&
    !directFileNameRegex.test(form.sourceFileMask)
  ) {
    errors.sourceFileMask =
      "Enter a valid file mask (e.g. *.csv), direct file name (e.g. test.csv), or placeholder (e.g. [$MASK]).";
  }

  // Target File Mask validation
  if (
    form.targetFileMask &&
    !placeholderRegex.test(form.targetFileMask) &&
    !fileMaskRegex.test(form.targetFileMask) &&
    !directFileNameRegex.test(form.targetFileMask)
  ) {
    errors.targetFileMask =
      "Enter a valid file mask (e.g. *.csv), direct file name (e.g. test.csv), or placeholder (e.g. [$MASK]).";
  }

  // 3b. If Source File Mask is not a direct file name, Target File Mask must not be a direct file name
  if (
    form.sourceFileMask &&
    !directFileNameRegex.test(form.sourceFileMask) &&
    form.targetFileMask &&
    directFileNameRegex.test(form.targetFileMask)
  ) {
    errors.targetFileMask =
      "Target File Mask should not be a direct file name if Source File Mask is a pattern or blank.";
  }
  return errors;
}
