export function validateJob(form) {
  const errors = {};

  // Allow [$NAME] and [#NAME]
  const placeholderRegex = /\[(\$|#)\w+\]/; // <-- not ^...$ so it matches inside a string
  const folderSegmentRegex = /^([\w\-\s\.]+|\[(\$|#)\w+\])$/;

  // Updated: allow placeholders anywhere in the file mask
  const fileMaskWithPlaceholderRegex =
    /^([\w,\s-]*\[(\$|#)\w+\][\w,\s-]*)+(\*|\.\w+|\*\.?\w*)*$/;
  const fileMaskRegex = /^(\*|\w+|\w+\*|\*\.\w+|\w+\.\w+|\w+\*\.?\w*)$/;
  const directFileNameRegex = /^[\w,\s-]+\.[A-Za-z]{2,}$/;
  const driveLetterRegex = /^[a-zA-Z]:\\/;
  const sharedFolderRegex = /^\\\\[^\\]+\\[^\\]+/;

  function isValidFolderPath(path) {
    if (!path) return false;
    const segments = path.split(/[\\/]/).filter(Boolean);
    return segments.every((seg) => folderSegmentRegex.test(seg));
  }

  function validateLocalFolder(path, field) {
    if (!driveLetterRegex.test(path)) {
      errors[field] =
        "Local folder must start with a drive letter, e.g., C:\\Users\\...";
      return false;
    }
    const segments = path.split(/[\\/]/).filter(Boolean);
    if (segments.length < 2) {
      errors[field] =
        "Enter a valid local folder path (must include at least one folder after the drive).";
      return false;
    }
    const invalidChar = /[<>:"|?*]/;
    for (const seg of segments.slice(1)) {
      if (!folderSegmentRegex.test(seg)) {
        errors[field] = `Invalid folder segment: ${seg}`;
        return false;
      }
      if (invalidChar.test(seg) && !placeholderRegex.test(seg)) {
        errors[field] = 'Folder names cannot contain <>:"/\\|?*';
        return false;
      }
    }
    const last = segments[segments.length - 1];
    if (/\.[\w]+$/.test(last) && !placeholderRegex.test(last)) {
      errors[field] = "Enter a valid local folder path (not a file path).";
      return false;
    }
    return true;
  }

  function validateSharedFolder(path, field) {
    const normalizedPath = path.replace(/\//g, "\\");
    if (!sharedFolderRegex.test(normalizedPath)) {
      errors[field] =
        "Shared folder must start with \\\\server\\share\\... or //server/share/...";
      return false;
    }
    const segments = normalizedPath.split("\\").filter(Boolean);
    if (segments.length < 3) {
      errors[field] =
        "Enter a valid shared folder path (must include at least one folder after the share).";
      return false;
    }
    const invalidChar = /[<>:"|?*]/;
    for (const seg of segments.slice(2)) {
      if (!folderSegmentRegex.test(seg)) {
        errors[field] = `Invalid folder segment: ${seg}`;
        return false;
      }
      if (invalidChar.test(seg) && !placeholderRegex.test(seg)) {
        errors[field] = 'Folder names cannot contain <>:"/\\|?*';
        return false;
      }
    }
    const last = segments[segments.length - 1];
    if (/\.[\w]+$/.test(last) && !placeholderRegex.test(last)) {
      errors[field] = "Enter a valid shared folder path (not a file path).";
      return false;
    }
    return true;
  }

  function validateAzureFolder(path, field) {
    if (!isValidFolderPath(path)) {
      errors[field] =
        "Enter a valid Azure folder path. Placeholders like [$NAME] or [#NAME] are allowed as segments.";
      return false;
    }
    const segments = path.split(/[\\/]/);
    const last = segments[segments.length - 1];
    if (/\.[\w]+$/.test(last) && !placeholderRegex.test(last)) {
      errors[field] = "Enter a valid Azure folder path (not a file path).";
      return false;
    }
    return true;
  }

  // --- Source validation ---
  if (form.sourceType === "local") {
    validateLocalFolder(form.source, "source");
  } else if (form.sourceType === "shared") {
    validateSharedFolder(form.source, "source");
  } else if (form.sourceType === "azure") {
    validateAzureFolder(form.source, "source");
  }

  // --- Target validation ---
  if (form.targetType === "local") {
    validateLocalFolder(form.target, "target");
  } else if (form.targetType === "shared") {
    validateSharedFolder(form.target, "target");
  } else if (form.targetType === "azure") {
    validateAzureFolder(form.target, "target");
  }

  // --- File Mask validation (allow placeholders anywhere in the mask) ---
  if (
    (!form.sourceFileMask || form.sourceFileMask.trim() === "") &&
    form.targetFileMask &&
    form.targetFileMask.trim() !== ""
  ) {
    errors.targetFileMask =
      "Target File Mask should be blank if Source File Mask is blank.";
  }

  if (
    form.sourceFileMask &&
    directFileNameRegex.test(form.sourceFileMask) &&
    form.targetFileMask &&
    !directFileNameRegex.test(form.targetFileMask)
  ) {
    errors.targetFileMask =
      "Target File Mask should also be a direct file name if Source File Mask is a direct file name.";
  }

  function isValidFileMask(mask) {
    return (
      !mask ||
      placeholderRegex.test(mask) ||
      fileMaskRegex.test(mask) ||
      directFileNameRegex.test(mask) ||
      fileMaskWithPlaceholderRegex.test(mask)
    );
  }

  if (form.sourceFileMask && !isValidFileMask(form.sourceFileMask)) {
    errors.sourceFileMask =
      "Enter a valid file mask (e.g. *.csv), direct file name (e.g. test.csv), placeholder (e.g. [$MASK] or [#MASK]), or a mask with placeholders (e.g. source_[#TodayAsyyyyMMdd].csv).";
  }

  if (form.targetFileMask && !isValidFileMask(form.targetFileMask)) {
    errors.targetFileMask =
      "Enter a valid file mask (e.g. *.csv), direct file name (e.g. test.csv), placeholder (e.g. [$MASK] or [#MASK]), or a mask with placeholders (e.g. source_[#TodayAsyyyyMMdd].csv).";
  }

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
