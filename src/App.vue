<template>
  <div id="app" class="container">
    <b-loading is-full-page v-model="loading">
      <div class="card">
        <div class="card-content">
          <div class="content">
            <b-icon
              pack="fas"
              icon="sync-alt"
              custom-class="fa-spin"
            />
            {{ loadingStatus }}
          </div>
        </div>
      </div>
    </b-loading>
    <div class="section">
      <div class="column">
        <div class="is-flex is-justify-content-space-between is-align-items-center">
          <div>
            <h1 class="title">facaccimo</h1>
            <h2 class="subtitle">{{ $t('app.subtitle') }}</h2>
          </div>
          <b-field :label="$t('app.language')" class="ml-4 mb-0">
            <b-select :value="$locale" @input="setLocale">
              <option v-for="locale in locales" :key="locale" :value="locale">{{ locale }}</option>
            </b-select>
          </b-field>
        </div>
      </div>
    </div>
    <HomePage v-if="page === HOME_PAGE" v-on:finished="cloneRepo" v-on:loading="displayLoader"
              v-on:loaded="finishLoader"/>
    <SeriesManager ref="manager" v-if="page === SERIES_MANAGER_PAGE" :series="series" v-on:series="goToSeries"
                   v-on:delete="deleteSeries" v-on:show="showUrl" v-on:loading="displayLoader"
                   v-on:loaded="finishLoader"/>
    <ChapterManager v-if="page === CHAPTER_MANAGER_PAGE" :name="fileName" :series="selectedSeries"
                    v-on:discard="discardSeries" v-on:save="saveSeries" v-on:chapter="goToChapter"
                    v-on:loading="displayLoader" v-on:loaded="finishLoader"/>
    <ChapterEditor v-if="page === CHAPTER_EDITOR_PAGE" :chapterKey="chapterKey" :chapter="chapter"
                   v-on:discard="discardChapter" v-on:save="saveChapter" v-on:loading="displayLoader"
                   v-on:loaded="finishLoader"/>
  </div>
</template>

<script>

import HomePage from "@/pages/HomePage";
import SeriesManager from "@/pages/SeriesManager";
import ChapterManager from "@/pages/ChapterManager";
import GitHubUtils from "@/GitHubUtils";
import Series from "@/model/Series";
import ChapterEditor from "@/pages/ChapterEditor";
import CorsProxy from "./CorsProxy";

export default {
  name: 'App',
  components: {
    ChapterEditor,
    ChapterManager,
    HomePage,
    SeriesManager
  },
  methods: {
    setLocale(locale) {
      this.$setLocale(locale);
    },
    showUrl(fileName) {
      const target = this;
      target.loadingStatus = this.$t('app.loading.creatingUrl');
      target.loading = true;
      GitHubUtils.getCurrentBranch(this.repoName, this.fs).then(value => {
        return GitHubUtils.getBase64EncodedSlug(
          GitHubUtils.getSeriesUrl(fileName, value, this.repoName, this.fs)
        );
      }).then(value => {
        target.loading = false;
        const url = 'https://cubari.moe/proxy/gist/' + value + '/';
        this.$buefy.dialog.confirm({
          title: this.$t('app.dialogs.cubariUrlTitle', { fileName }),
          message: '<a href="' + url + '" target="_blank">' + url + '</a>',
          confirmText: this.$t('app.dialogs.ok'),
          type: 'is-primary',
          hasIcon: true
        });
      })
    },
    cloneRepo(data) {
      this.pat = data.pat;
      this.username = data.username;
      this.repoName = data.repoName;
      this.email = data.email;
      const target = this;
      if (this.email === '') {
        this.$buefy.dialog.prompt({
          message: this.$t('app.dialogs.emailPrompt'),
          inputAttrs: {
            placeholder: this.$t('home.emailPlaceholder')
          },
          closeOnConfirm: false,
          trapFocus: true,
          canCancel: false,
          onConfirm: (value, { close }) => {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (re.test(String(value).toLowerCase())) {
              target.email = value;
              window.localStorage.setItem('email', target.email);
              close();
              target.loading = true;
              target.loadingStatus = this.$t('app.loading.cloningRepo');
              GitHubUtils.cloneRepo(this.repoName).then(value1 => {
                target.fs = value1;
                target.loadingStatus = this.$t('app.loading.parsingData');
                target.parseData();
              }).catch((err) => {
                console.error(err);
                target.loading = false;
                target.loadingStatus = '';
                this.$buefy.toast.open({ message: this.$t('app.toasts.cloneFailed', { message: err.message }), type: 'is-danger' });
              })
            } else {
              this.$buefy.toast.open({ message: this.$t('app.toasts.invalidEmail'), type: 'is-danger' });
            }
          }
        })
      } else {
        target.loading = true;
        target.loadingStatus = this.$t('app.loading.cloningRepo');
        GitHubUtils.cloneRepo(this.repoName)
          .then(value => {
            target.fs = value;
            target.loadingStatus = this.$t('app.loading.parsingData');
            target.parseData();
          }).catch((err) => {
            console.error(err);
            target.loading = false;
            target.loadingStatus = '';
            this.$buefy.toast.open({ message: this.$t('app.toasts.cloneFailed', { message: err.message }), type: 'is-danger' });
          });
      }
    },
    parseData() {
      this.series = [];
      const noExt = [];
      this.fs.readdir('/', {}, (err, files) => {
        const promises = [];
        files.forEach(file => {
          if (file.endsWith('.json') && file !== 'index.json') {
            promises.push(this.fs.promises.readFile('/' + file, {}).then(data => {
              this.loadingStatus = this.$t('app.loading.parsingFile', { file });
              try {
                this.series.push({
                  name: file,
                  data: Series.fromJson(JSON.parse(new TextDecoder().decode(data)))
                });
              } catch (e) {
                this.$buefy.toast.open({
                  message: this.$t('app.toasts.parseFailed', { file, message: e.message }),
                  type: 'is-danger',
                  duration: 5000
                });
              }
            }))
          } else if (file.indexOf('.') === -1) {
            promises.push(this.fs.promises.readFile('/' + file, {}).then(data => {
              this.loadingStatus = this.$t('app.loading.parsingFile', { file });
              try {
                noExt.push({
                  name: file,
                  data: Series.fromJson(JSON.parse(new TextDecoder().decode(data)))
                });
              } catch {
                // We only check whether those files potentially could be series
              }
            }))
          }
        });
        return Promise.all(promises).then(() => {
          this.loading = false;
          if (noExt.length !== 0) {
            this.$buefy.dialog.confirm({
              title: this.$t('app.dialogs.noExtensionTitle'),
              message: this.$t('app.dialogs.noExtensionMessage', { files: noExt.map(value => value.name).join('\n') }),
              confirmText: this.$t('app.dialogs.rename'),
              type: 'is-primary',
              hasIcon: true,
              onConfirm: () => this.renameChapters(noExt),
              onCancel: () => this.page = this.SERIES_MANAGER_PAGE
            });
          } else {
            this.page = this.SERIES_MANAGER_PAGE;
          }
          if (!window.localStorage || !window.localStorage.getItem('skipTopics')) {
            GitHubUtils.getTopics(this.repoName, this.username, this.pat).then(value => {
              const names = value.data.names;
              if (names.indexOf('cubari-source') === -1) {
                this.$buefy.dialog.confirm({
                  title: this.$t('app.dialogs.topicTitle'),
                  message: this.$t('app.dialogs.topicMessage'),
                  confirmText: this.$t('app.dialogs.add'),
                  type: 'is-primary',
                  hasIcon: true,
                  onConfirm: () => {
                    names.push('cubari-source');
                    GitHubUtils.setTopics(names, this.repoName, this.username, this.pat);
                  },
                  onCancel: () => {
                    window.localStorage.setItem('skipTopics', '1');
                  }
                });
              }
            })
          }
        });
      })
    },
    renameChapters(noExt) {
      const target = this;
      this.loadingStatus = this.$t('app.loading.renamingFiles');
      this.loading = true;
      const promises = [];
      for (const item of noExt) {
        promises.push(Promise.all([
          this.fs.promises.rename('/' + item.name, '/' + item.name + '.json'),
          GitHubUtils.rename(item.name, item.name + '.json', this.fs)
        ]));
        item.name = item.name + '.json'
        this.series.push(item);
      }
      GitHubUtils.push(GitHubUtils.commit(Promise.all(promises), this.fs, 'Add .json extensions', this.email), this.fs, this.username, this.pat).then(() => {
        target.loading = false;
        this.page = this.SERIES_MANAGER_PAGE;
      })
    },
    deleteSeries(fileName) {
      this.loadingStatus = this.$t('app.loading.deletingSeries', { fileName });
      this.loading = true;
      const target = this;
      GitHubUtils.deleteSeries(fileName, this.username, this.pat, this.fs, this.email).then(() => {
        target.parseData();
        target.loading = false;
        this.$buefy.toast.open(this.$t('app.toasts.seriesDeleted'))
      })
    },
    goToSeries(name) {
      this.fs.promises.readFile('/' + name, {}).then(value => {
        this.fileName = name;
        this.selectedSeries = Series.fromJson(JSON.parse(new TextDecoder().decode(value)));
        this.page = this.CHAPTER_MANAGER_PAGE;
      })
          .catch(() => {
            this.fileName = name;
            this.selectedSeries = new Series(name.replace('.json', ''));
            this.page = this.CHAPTER_MANAGER_PAGE;
          })
    },
    discardSeries() {
      this.page = this.SERIES_MANAGER_PAGE;
    },
    saveSeries(name, series) {
      this.loadingStatus = this.$t('app.loading.savingSeries', { fileName: name });
      this.loading = true;
      const target = this;
      GitHubUtils.addSeries(name, series, this.username, this.pat, this.fs, this.email).then(() => {
        target.parseData(true);
      }).catch(e => {
        console.log(e);
        target.loading = false;
        const details = e.data ? '\n' + e.data.response : '';
        this.$buefy.toast.open({ message: this.$t('app.toasts.saveError', { details }), type: 'is-danger', duration: 5000 })
      });
    },
    goToChapter(key, chapter) {
      this.chapterKey = key;
      this.chapter = chapter;
      this.page = this.CHAPTER_EDITOR_PAGE;
    },
    discardChapter() {
      this.page = this.CHAPTER_MANAGER_PAGE;
    },
    saveChapter(key, chapter) {
      this.selectedSeries.chapters[key] = chapter;
      this.page = this.CHAPTER_MANAGER_PAGE;
    },
    displayLoader(msg) {
      this.loading = true;
      this.loadingStatus = msg;
    },
    finishLoader() {
      this.loading = false;
    }
  },
  mounted() {
    if (process.env.NODE_ENV === 'development') {
      document.title = 'facaccimo (dev)';
    }
    CorsProxy.isAvailable().then(value => {
      if (!value) {
        this.$buefy.dialog.confirm({
          title: this.$t('app.dialogs.corsUnavailableTitle'),
          message: this.$t('app.dialogs.corsUnavailableMessage'),
          confirmText: this.$t('app.dialogs.ok'),
          type: 'is-primary',
          hasIcon: true
        });
      } else if (process.env.NODE_ENV === 'development') {
        this.$buefy.toast.open({ message: this.$t('app.toasts.corsAvailable'), type: 'is-success' });
      }
    });
  },
  data: function () {
    return {
      HOME_PAGE: 'home',
      SERIES_MANAGER_PAGE: 'seriesManager',
      CHAPTER_MANAGER_PAGE: 'chapterManager',
      CHAPTER_EDITOR_PAGE: 'chapterEditor',
      page: 'home',
      email: '',
      pat: '',
      username: '',
      repoName: '',
      fileName: '',
      chapterKey: '',
      chapter: null,
      saved: false,
      loading: false,
      loadingStatus: '',
      fs: null,
      series: [],
      selectedSeries: null,
      locales: ['pt-BR', 'en']
    }
  }
}
</script>

<style>

</style>
