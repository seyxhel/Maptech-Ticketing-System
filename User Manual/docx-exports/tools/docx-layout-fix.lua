-- Pandoc Lua filter for cleaner DOCX layout.
-- 1) Keep images consistently sized and centered.
-- 2) Insert page breaks before each level-2 section (except the first) for clearer module/stage separation.

local MAX_IMAGE_WIDTH = "15.5cm"

function Image(img)
  if not img.attributes["width"] and not img.attributes["height"] then
    img.attributes["width"] = MAX_IMAGE_WIDTH
  end
  img.attributes["fig-align"] = "center"
  return img
end

function Pandoc(doc)
  local blocks = {}
  local first_h2_seen = false

  for _, blk in ipairs(doc.blocks) do
    if blk.t == "Header" and blk.level == 2 then
      if first_h2_seen then
        table.insert(blocks, pandoc.RawBlock("openxml", "<w:p><w:r><w:br w:type=\"page\"/></w:r></w:p>"))
      else
        first_h2_seen = true
      end
    end
    table.insert(blocks, blk)
  end

  doc.blocks = blocks
  return doc
end
