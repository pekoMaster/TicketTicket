# OpenSpec Archive Command

Archive completed feature changes and update source specifications.

## Instructions

When this command is invoked:

1. Verify the feature implementation is complete
   - All tasks in `tasks.md` are marked complete
   - Code is tested and working

2. Merge specs to source:
   - Copy approved specs from `openspec/changes/[feature-name]/specs/`
   - Update `openspec/specs/` with new or modified specs
   - Handle ADDED, MODIFIED, REMOVED sections appropriately

3. Archive the change folder:
   - Move `openspec/changes/[feature-name]/` to `openspec/archive/`
   - Add completion date to archived folder name

4. Update documentation if needed

5. Report archive completion

## Usage
```
/openspec-archive [feature-name]
```
