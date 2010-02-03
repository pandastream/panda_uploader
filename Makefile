PACKAGE_NAME = panda_js_uploader
SRC_DIR = src
BUILD_DIR = build
PREFIX = .
DIST_DIR = ${PREFIX}/dist
PANDA_DIST_DIR = ${DIST_DIR}/${PACKAGE_NAME}
PU_TAR = ${DIST_DIR}/${PACKAGE_NAME}.tar.gz
PU_CAT = ${DIST_DIR}/jquery.panda-uploader.cat.js
PU_MIN = ${PANDA_DIST_DIR}/jquery.panda-uploader.min.js
GENERATED = ${PU_MIN} ${PU_CAT} ${PU_TAR}

MINJAR = java -jar ${BUILD_DIR}/google-compiler-20100202.jar

MODULES = ${SRC_DIR}/swfupload.js\
	${SRC_DIR}/jquery.swfupload.js\
	${SRC_DIR}/jquery.panda-uploader.js


all: min tar
	@@echo "Panda uploader build complete."

tar: ${PU_TAR}

min: ${PU_MIN}

${PU_TAR}: ${PU_MIN}
	@@echo "Packaging as " ${PU_TAR}
	@@tar zcf ${PU_TAR} -C ${DIST_DIR} ${PACKAGE_NAME}

${PU_MIN}: ${PU_CAT}
	@@echo "Copying minified file to " ${PU_MIN}
	@@${MINJAR} --js ${PU_CAT} --warning_level QUIET >> ${PU_MIN}
	@@rm -f ${PU_CAT}

${PU_CAT}:
	@@echo "Building" ${PU_CAT}
	@@cat ${MODULES} > ${PU_CAT}

clean:
	@@echo "Removing Minimized js:" ${GENERATED}
	@@rm -f ${GENERATED}
