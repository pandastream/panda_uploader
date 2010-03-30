PANDA_UPLOADER_VERSION = 0.1
PACKAGE_NAME = panda_uploader
SRC_ROOT = src
SRC_DIR = ${SRC_ROOT}/src
BUILD_DIR = ${SRC_ROOT}/build
PREFIX = .
DIST_DIR = ${PREFIX}
PANDA_DIST_DIR = ${DIST_DIR}/${PACKAGE_NAME}
PU_TAR = ${DIST_DIR}/${PACKAGE_NAME}.tar.gz
PU_CAT = ${DIST_DIR}/jquery.panda-uploader-${PANDA_UPLOADER_VERSION}.cat.js
PU_MIN = ${PANDA_DIST_DIR}/jquery.panda-uploader-${PANDA_UPLOADER_VERSION}.min.js
PU_SIMPLE = ${SRC_DIR}/jquery.panda-uploader.js
TMP_PU_VERSION = ${SRC_DIR}/jquery.panda-uploader-${PANDA_UPLOADER_VERSION}.js
GENERATED = ${PU_MIN} ${PU_CAT} ${PU_TAR} ${TMP_PU_VERSION}

MINJAR = java -jar ${BUILD_DIR}/google-compiler-20100226.jar

MODULES = ${SRC_DIR}/swfupload.js\
	${SRC_DIR}/jquery.swfupload.js\
	${SRC_DIR}/jquery.panda-uploader-${PANDA_UPLOADER_VERSION}.js

all: versionize min tar
	@@rm -f ${TMP_PU_VERSION}
	@@echo "Panda uploader build complete."

debug: ${PU_CAT}

tar: ${PU_TAR}

min: ${PU_MIN}

versionize:
	@@echo "Generate version" ${PANDA_UPLOADER_VERSION}
	@@echo  "// version: ${PANDA_UPLOADER_VERSION}" > ${TMP_PU_VERSION}
	@@echo  "// name: ${PACKAGE_NAME}" >> ${TMP_PU_VERSION}
	@@echo  "" >> ${TMP_PU_VERSION}
	@@cat ${PU_SIMPLE} >> ${TMP_PU_VERSION}
  
${PU_TAR}: ${PU_MIN}
	@@echo "Packaging as " ${PU_TAR}
	@@tar zcf ${PU_TAR} -C ${DIST_DIR} ${PACKAGE_NAME}

${PU_MIN}: ${PU_CAT}
	@@echo "Minifying" ${PU_CAT}
	@@${MINJAR} --js ${PU_CAT} --warning_level QUIET > ${PU_MIN}
	@@echo "Copying minified file to " ${PU_MIN}
	@@rm -f ${PU_CAT}
	

${PU_CAT}: ${PU_SIMPLE}
	@@echo "Building" ${PU_CAT}
	@@cat ${MODULES} > ${PU_CAT}

clean:
	@@echo "Removing Minimized js:" ${GENERATED}
	@@rm -f ${GENERATED}
