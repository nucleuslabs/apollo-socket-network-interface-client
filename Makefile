BIN := node_modules/.bin
SRC_FILES := $(shell find src -name '*.js')
DIST_FILES := $(patsubst src/%,dist/%,$(SRC_FILES))
DIST_DIRS := $(sort $(dir $(DIST_FILES)))

# these are not files
.PHONY: all clean nuke debug test dev

# disable default suffixes
.SUFFIXES:


all: $(DIST_FILES)

dist/%.js: src/%.js yarn.lock .babelrc | $(DIST_DIRS)
	$(BIN)/babel $< -o $@

$(DIST_DIRS):
	mkdir -p $@

yarn.lock: node_modules package.json
	@yarn install --production=false
	@touch -mr $(shell ls -Atd $? | head -1) $@

node_modules:
	mkdir -p $@

debug:
	$(info SRC_FILES: $(SRC_FILES))
	$(info DIST_FILES: $(DIST_FILES))
	$(info DIST_DIRS: $(DIST_DIRS))

publish:
	npm version patch
	npm publish

clean:
	rm -rf node_modules dist

nuke: clean
	rm -rf yarn.lock