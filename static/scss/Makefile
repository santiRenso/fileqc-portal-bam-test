GENDIR=/local_data/qc/static/css

SASSC=sassc -t compressed

SASS_FILES=_base.scss \
           _table.scss \
           _fileinfo.scss \
           _graphs.scss \
           _plot-stats.scss \
           _plots.scss \
           _mixin.scss \
           _variables.scss

all: $(GENDIR)/error.css $(GENDIR)/style.css

$(GENDIR):
	mkdir -p $@

$(GENDIR)/%.css: %.scss $(SASS_FILES) | $(GENDIR)
	$(SASSC) $< $@
